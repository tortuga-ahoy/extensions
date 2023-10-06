import { describe, expect, test } from "vitest";

const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export const testAdapter = async (adapter) => {
  test(`has a valid semantic version number (${adapter.version})`, () => {
    expect(adapter.version).toMatch(SEMVER_REGEX);
  });

  test(`is of valid type (${adapter.type})`, () => {
    expect(["source", "metadata", "filehost"]).toContain(adapter.type);
  });

  describe.runIf(adapter.type === "source")("works correctly as a source adapter", async () => {
    test(`has a valid home (${adapter.home})`, () => {
      expect(adapter.home).toBeTruthy();
    });

    test(`has a valid RegEx url pattern match`, () => {
      expect(adapter.match).toBeInstanceOf(RegExp);
    });

    let games = [];
    let game = {};

    const puppeteer = await import("puppeteer-extra");
    const StealthPlugin = (await import("puppeteer-extra-plugin-stealth")).default;
    puppeteer.use(StealthPlugin());

    const browser = await puppeteer.launch({ headless: false });

    test(
      `searching returns a valid list of games`,
      async () => {
        const results = await adapter.search(browser, { query: "fallout" });
        expect(results).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ title: expect.any(String), url: expect.any(String) }),
          ])
        );
        games = results;
      },
      { timeout: 10 * 1000 }
    );

    test(
      `fetching a game returns valid data`,
      async () => {
        const result = await adapter.fetch(browser, { url: games[0].url });
        expect(result).toBeDefined();
        game = result;
      },
      { timeout: 10 * 1000 }
    );

    test("game title is defined", () => {
      expect(game.title).toBeDefined();
    });
  });
};