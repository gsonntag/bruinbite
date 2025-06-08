from selenium.webdriver.chrome.options import Options
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import datetime

'''

Return format will be as follows:
{
  'yyyy-mm-dd-RIEBER-DINNER': {
    'truck-names': ['BittieBitez']
  },
  'yyyy-mm-dd-SPROUL-LATE_NIGHT': {
    'truck-names': ['Salpicon'],
  },
}


'''

# helper to parse any of these tables
def parse_table(table):
    out = []
# skip the header row by selecting only <tbody> rows
    for row in table.find_elements(By.CSS_SELECTOR, "tbody tr"):
        cells = row.find_elements(By.TAG_NAME, "td")
        date    = cells[0].text
        slot_1  = cells[1].text
        slot_2  = cells[2].text
        out.append({
            "date": date,
            "5–8:30pm": slot_1,
            "9–12am": slot_2
        })
    return out

def normalize_data(data_list, location, out, year=2025):
    """
    data_list: list of {'date': 'Sun, June 8', '5–8:30pm': str, '9–12am': str}
    location:  e.g. 'SPROUL' or 'RIEBER'
    """
    slot_map = {
        '5–8:30pm': 'DINNER',
        '9–12am':   'LATE_NIGHT'
    }
    for entry in data_list:
        # 1) parse "Sun, June 8" → "2025-06-08"
        _, md = entry['date'].split(',', 1)
        dt = datetime.datetime.strptime(md.strip() + f' {year}', '%B %d %Y').date()
        iso = dt.isoformat()

        # 2) for each slot, split multi-line names and build key
        for slot, tag in slot_map.items():
            raw = entry[slot].strip()
            if not raw:
                continue
            # allow multiple trucks separated by newline
            trucks = [t.strip() for t in raw.split('\n') if t.strip()]
            key = f"{iso}-{location}-{tag}"
            out[key] = {'truck-names': trucks}

    return out

def fetch_food_truck_data():
    options = Options()
    options.add_experimental_option("detach", True)
    options.add_argument("--headless")

    driver = webdriver.Chrome(options=options)
    driver.get('https://dining.ucla.edu/meal-swipe-exchange/')

    wait = WebDriverWait(driver, 10)
    # wait until at least one table is on the page
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "table.ucla-table__border")))

    # locate Sproul’s schedule
    sproul_table = driver.find_element(
    By.XPATH,
        "//h3[normalize-space(.)='Sproul']/following-sibling::figure//table"
    )
    sproul_data = parse_table(sproul_table)

    # locate Rieber’s schedule the same way
    rieber_table = driver.find_element(
    By.XPATH,
        "//h3[normalize-space(.)='Rieber']/following-sibling::figure//table"
    )
    rieber_data = parse_table(rieber_table)

    out = {}
    year = datetime.datetime.now().year
    normalize_data(sproul_data, 'SPROUL', out, year)
    normalize_data(rieber_data, 'RIEBER', out, year)
    return out

def main():
    print(json.dumps(fetch_food_truck_data(), separators=(',',':')))


if __name__ == '__main__':
    main()