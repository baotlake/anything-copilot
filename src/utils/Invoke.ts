type CallbackItem = {
  resolve: (v: any) => void
  reject: (e: any) => void
}

abstract class Invoke {
  private pendingCallback: Record<string, CallbackItem>
  private count: number
  private name: string

  constructor(name: string) {
    this.name = name
    this.pendingCallback = {}
    this.count = 0
  }

  protected get key() {
    return `${this.name}-${this.count++}`
  }

  protected getReturnValue(key: string) {
    const promise = new Promise((resolve, reject) => {
      this.pendingCallback[key] = { resolve, reject }
    })
    return promise
  }

  protected setReturnValue(key: string, success: boolean, payload: any) {
    const callback = this.pendingCallback[key]
    if (callback) {
      const fn = success != false ? callback.resolve : callback.reject
      fn(payload)
      delete this.pendingCallback[key]
    }
  }

  abstract send(req: any): Promise<{ key: string; response: any }>
  abstract handleMessage(message: any): void

  public async invoke(req: any) {
    const { key } = await this.send(req)
    const result = await this.getReturnValue(key)
    delete this.pendingCallback[key]
    return result
  }
}

export default Invoke
export { Invoke }
