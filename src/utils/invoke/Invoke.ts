type CallbackItem = {
  resolve: (v: any) => void
  reject: (e: any) => void
}

export interface InvokeReq {
  func: string
  args: any[]
  timeout?: number
  key?: string
  [key: string]: any
}

export interface InvokeRes {
  key: string
  success: boolean
  value: any
}

export abstract class Invoke {
  private pendingCallback: Record<string, CallbackItem>
  private count: number
  private name: string
  private uniqueId: string
  private services: Map<string, Function>

  constructor(name: string) {
    this.name = name
    this.uniqueId = `${Math.round(Math.random() * 1e6)}`
    this.pendingCallback = {}
    this.count = 0
    this.services = new Map()
  }

  protected get key() {
    return `${this.name}-${this.uniqueId}-${this.count++}`
  }

  protected getReturnValue(key: string, req: InvokeReq) {
    let timer: any
    const { func, timeout } = req
    const promise = new Promise<any>((resolve, reject) => {
      this.pendingCallback[key] = { resolve, reject }
      if (timeout) {
        timer = setTimeout(
          () => reject(`"${this.name}" invoke timeout: ${func} key: ${key}`),
          timeout
        )
      }
    })

    promise.finally(() => {
      delete this.pendingCallback[key]
      timer && clearTimeout(timer)
    })

    return promise
  }

  protected setReturnValue(key: string, success: boolean, value: any) {
    const callback = this.pendingCallback[key]
    if (callback) {
      const fn = success != false ? callback.resolve : callback.reject
      fn(value)
    } else {
      console.error(`unknown invoke callback message: ${key}`)
      console.log(this.pendingCallback)
    }
  }

  abstract send(req: InvokeReq): Promise<{ key: string }>
  public handleResMsg(message: InvokeRes) {
    const { key, success, value } = message
    this.setReturnValue(key, success, value)
  }

  public async handleReqMsg(message: InvokeReq) {
    const { key, func, args, timeout } = message
    let result = null
    let error = null
    try {
      const service = this.services.get(func)
      if (service) {
        result = await service(...args)
      } else {
        error = `unknown service: ${func}`
        console.warn(`unknown service: ${func}`)
        return null
      }
    } catch (err) {
      console.error("invoke error: ", err)
      error = err
    }

    return { key, success: !error, value: !error ? result : error }
  }

  public async invoke<T = any>(req: InvokeReq): Promise<T> {
    const { key } = await this.send(req)
    req.timeout = req.timeout || 20000
    return this.getReturnValue(key, req)
  }

  public register(func: string, service: Function) {
    this.services.set(func, service)
    return this
  }

  public unregister(func: string) {
    this.services.delete(func)
    return this
  }
}

export default Invoke
