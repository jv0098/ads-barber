import os
from pathlib import Path
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

@pytest.fixture
def driver():
    root = Path(__file__).resolve().parents[1]
    index = root / "index.html"

    options = Options()
    options.add_argument("--window-size=390,900")

    if os.getenv("HEADLESS", "true").lower() != "false":
        options.add_argument("--headless=new")

    service = Service(ChromeDriverManager().install())
    browser = webdriver.Chrome(service=service, options=options)

    browser.get(index.as_uri())
    browser.execute_script("localStorage.clear(); location.reload();")

    yield browser

    browser.quit()