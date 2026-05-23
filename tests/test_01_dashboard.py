from selenium.webdriver.support.ui import WebDriverWait

def test_dashboard_inicial(driver):
    WebDriverWait(driver, 10).until(
        lambda d: d.find_element("css selector", "#screen-home").is_displayed()
    )

    assert driver.find_element("css selector", "#hero-total").text == "R$ 0,00"
    assert driver.find_element("css selector", "#stat-apts").text == "0"
    assert driver.find_element("css selector", "#stat-done").text == "0"
    assert driver.find_element("css selector", "#stat-pending").text == "0"