from io import BytesIO
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright, expect

def diff_bbox(a: bytes, b: bytes):
    img1 = Image.open(BytesIO(a)).convert("RGB")
    img2 = Image.open(BytesIO(b)).convert("RGB")
    diff = ImageChops.difference(img1, img2)
    return diff.getbbox()

def test_canvas(base_url="http://localhost:3030"):
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-gpu-sandbox",
                "--ignore-gpu-blocklist",
                "--use-gl=swiftshader",
            ],
        )
        page = browser.new_page(device_scale_factor=1, viewport={"width": 800, "height": 600})
        page.goto(f"{base_url}/?e2e=1", wait_until="domcontentloaded")

        page.wait_for_function("window.__atlasTest?.ready === true")

        canvas = page.locator("canvas")
        expect(canvas).to_be_visible()

        # Take a screenshot of the initial state
        initial_screenshot = canvas.screenshot()

        # Switch to "Ride the Comet" mode
        page.evaluate("window.__atlasTest.enterRide()")
        page.evaluate("(async () => { await window.__atlasTest.ensureFrame(3); })()")

        # Take a screenshot of the new state
        final_screenshot = canvas.screenshot()

        # Compare the screenshots to ensure a visual change has occurred
        bbox = diff_bbox(initial_screenshot, final_screenshot)
        assert bbox is not None, "Camera view did not visually change in ride mode"

        # Save the final screenshot for visual confirmation
        with open("jules-scratch/verification/final_canvas_view.png", "wb") as f:
            f.write(final_screenshot)

        browser.close()

if __name__ == "__main__":
    test_canvas()