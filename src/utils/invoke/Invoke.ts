type CallbackItem = {
  resolve: (v: any) => void
  reject: (e: any) => void
}

interface InvokeReq {
  func: string
  args: any[]
  timeout?: number
}

interface InvokeRes {
  key: string
  success: boolean
  value: any
}

abstract class Invoke {
  private pendingCallback: Record<string, CallbackItem>
  private count: number
  private name: string
  private uniqueId: string

  constructor(name: string) {
    this.name = name
    this.uniqueId = `${Math.round(Math.random() * 1e6)}`
    this.pendingCallback = {}
    this.count = 0
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

  abstract send(req: InvokeReq): Promise<{ key: string; response: any }>
  abstract handleResMsg(message: InvokeRes): void

  public async invoke<T = any>(req: InvokeReq): Promise<T> {
    const { key } = await this.send(req)
    req.timeout = req.timeout || 20000
    return this.getReturnValue(key, req)
  }
}

export default Invoke
export { Invoke }
