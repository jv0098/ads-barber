from selenium.webdriver.support.ui import WebDriverWait

def test_criar_novo_servico(driver):
    wait = WebDriverWait(driver, 10)

    wait.until(
        lambda d: d.find_element("css selector", "#screen-home").is_displayed()
    )

    # Ir para Config
    driver.find_element("css selector", '.nav-item[data-screen="config"]').click()

    wait.until(
        lambda d: d.find_element("css selector", "#screen-config").is_displayed()
    )

    # Clicar em Novo Serviço
    botoes = driver.find_elements("css selector", ".big-btn")
    botoes[-1].click()

    wait.until(
        lambda d: d.find_element("css selector", "#modal-service").get_attribute("class").find("open") != -1
    )

    # Preencher serviço
    driver.find_element("css selector", "#service-name-input").send_keys("Sobrancelha")
    driver.find_element("css selector", "#service-price-input").send_keys("20")
    driver.find_element("css selector", "#service-dur-input").send_keys("15")

    # Salvar
    driver.find_element("css selector", "#modal-service .btn-save").click()

    wait.until(
        lambda d: "Sobrancelha" in d.find_element("css selector", "#services-config").text
    )

    conteudo = driver.find_element("css selector", "#services-config").text

    assert "Sobrancelha" in conteudo
    assert "R$ 20,00" in conteudo
    assert "15 min" in conteudo