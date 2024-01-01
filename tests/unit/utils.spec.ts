import { describe, test, expect } from "vitest"
import { semanticClip } from "@/utils/utils"

describe("utils/utils.ts", () => {
  test("semantic slip", () => {
    const text = `Here the beforeEach ensures that the database is reset for each test.
  
    If beforeEach is inside a describe block, it runs for each test in the describe block.
    
    If you only need to run some setup code once, before any tests run, use beforeAll instead.`

    expect(semanticClip(text, 80)).toBe(text.slice(0, 73))
    expect(semanticClip(text, 174)).toBe(text.slice(0, 169))
    expect(semanticClip(text, 300)).toBe(text.slice(0, 267))
  })
})
