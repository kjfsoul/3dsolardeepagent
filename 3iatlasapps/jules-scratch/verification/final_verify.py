from playwright.sync_api import Page, expect, sync_playwright
import time

def final_verify(page: Page):
    """
    This test performs a final verification of all new features.
    """
    # 1. Arrange: Go to the application homepage.
    page.goto("http://localhost:3030")

    # 2. Wait for the 3D tracker to finish loading.
    frame_counter = page.locator('text=/Frame \\d+ \\/ \\d+/')
    expect(frame_counter).to_be_visible(timeout=60000)

    # Give the labels a moment to appear
    time.sleep(1)

    # 3. Verify that the planetary labels are visible.
    expect(page.get_by_text("Earth", exact=True)).to_be_visible()
    expect(page.get_by_text("Mars", exact=True)).to_be_visible()
    page.screenshot(path="jules-scratch/verification/labels_visible.png")

    # 4. Switch to "Follow 3I/ATLAS" and verify tooltips
    camera_select = page.locator('select', has_text='Solar System View')
    camera_select.select_option('followComet')
    time.sleep(1) # Give UI time to update
    expect(page.locator('span[title="How far the camera stays from the comet"]')).to_be_visible()
    expect(page.locator('span[title="How high the camera is positioned above the comet\'s orbital plane"]')).to_be_visible()
    expect(page.locator('span[title="How quickly the camera follows the comet\'s movement (lower is smoother)"]')).to_be_visible()

    # 5. Switch to "Ride the Comet" camera mode.
    camera_select.select_option('rideComet')

    # Give the camera time to transition
    time.sleep(3)

    # 6. Take a screenshot of the "Ride the Comet" view.
    page.screenshot(path="jules-scratch/verification/ride_the_comet_final.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        final_verify(page)
        browser.close()

if __name__ == "__main__":
    main()