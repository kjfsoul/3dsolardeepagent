
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:5173")
        page.wait_for_selector("text=Interact 3D: OFF")
        page.click("text=Interact 3D: OFF")
        page.wait_for_selector("text=Interact 3D: ON")
        page.screenshot(path="jules-scratch/verification/verification.png")
        browser.close()

run()
