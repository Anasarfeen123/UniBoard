import type { VtopErrorCode } from "./types"

export class VtopScraperError extends Error {
  constructor(
    public code: VtopErrorCode,
    message: string,
    public recoverable = true,
  ) {
    super(message)
    this.name = "VtopScraperError"
  }
}

export function toVtopError(error: unknown) {
  if (error instanceof VtopScraperError) {
    return error
  }

  const message = error instanceof Error ? error.message : "VTOP sync failed unexpectedly."
  if (/Executable doesn't exist|playwright install|sandbox_host_linux|Target page, context or browser has been closed|Operation not permitted/i.test(message)) {
    return new VtopScraperError(
      "CONNECTOR_UNAVAILABLE",
      "The VTOP connector cannot launch Chromium here. Run `npx playwright install chromium` and allow the server process to start a headless browser.",
      false,
    )
  }
  if (/net::|timeout|ENOTFOUND|ECONN|EAI_AGAIN/i.test(message)) {
    return new VtopScraperError("NETWORK_ERROR", "VTOP Chennai could not be reached. Check your connection and try again.")
  }

  return new VtopScraperError("SCRAPE_FAILED", "UniBoard could not read the latest VTOP page structure. Try again later.")
}
