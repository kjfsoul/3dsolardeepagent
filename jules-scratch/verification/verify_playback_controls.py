
from playwright.sync_api import Page, expect

def test_playback_controls_visibility(page: Page):
    """
    This test verifies that the playback controls are visible and not clipped.
    """
    # 1. Arrange: Go to the application.
    page.goto("http://localhost:5173")

    # 2. Act: Wait for the scene to load.
    page.wait_for_selector("canvas")

    # 3. Assert: Check that the playback controls are visible.
    playback_controls = page.locator(".playback-controls")
    expect(playback_controls).to_be_visible()

    # 4. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/playback-controls.png")
