from selenium.webdriver.support.ui import WebDriverWait

def test_navegacao_telas(driver):

    WebDriverWait(driver, 10).until(
        lambda d: d.find_element("css selector", "#screen-home").is_displayed()
    )

    driver.find_element("css selector", '.nav-item[data-screen="agenda"]').click()

    tela = driver.find_element("css selector", ".screen.active").get_attribute("id")

    assert tela == "screen-agenda"

    driver.find_element("css selector", '.nav-item[data-screen="clients"]').click()

    tela = driver.find_element("css selector", ".screen.active").get_attribute("id")

    assert tela == "screen-clients"

    driver.find_element("css selector", '.nav-item[data-screen="fin"]').click()

    tela = driver.find_element("css selector", ".screen.active").get_attribute("id")

    assert tela == "screen-fin"

    driver.find_element("css selector", '.nav-item[data-screen="config"]').click()

    tela = driver.find_element("css selector", ".screen.active").get_attribute("id")

    assert tela == "screen-config"