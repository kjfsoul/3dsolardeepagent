from playwright.sync_api import Page, expect, sync_playwright

def verify_stability(page: Page):
    """
    This test verifies that the 3D tracker loads and the application is stable.
    """
    # 1. Arrange: Go to the application homepage.
    page.goto("http://localhost:3030")

    # 2. Act: Wait for the 3D tracker to finish loading.
    # The UI shows "Frame X / Y" when it's running.
    # We'll wait for this text to appear, which indicates the animation loop is running.
    frame_counter = page.locator('text=/Frame \\d+ \\/ \\d+/')

    # Wait up to 60 seconds for the tracker to load data and render.
    expect(frame_counter).to_be_visible(timeout=60000)

    # 3. Assert: The presence of the frame counter is our assertion.
    # Now, take a screenshot for visual confirmation.
    page.screenshot(path="jules-scratch/verification/verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_stability(page)
        browser.close()

if __name__ == "__main__":
    main()