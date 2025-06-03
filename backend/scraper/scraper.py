from selenium import webdriver
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import json
import sys
from selenium.webdriver.common.actions.wheel_input import ScrollOrigin
from selenium.webdriver import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.options import Options

from selenium.common.exceptions import TimeoutException

def fetch_dining_data():
    dining_halls = [
        "bruin-plate",
        "de-neve-dining",
        "epicuria-at-covel",
        "bruin-cafe",
        "cafe-1919",
        "epicuria-at-ackerman",
        # "meal-swipe-exchange", # HILL FOOD TRUCKS -- NEEDS EXTRA PROCESSING
        "rendezvous", # build your own, how do we want to do that?
        "the-drey",
        "the-study-at-hedrick", # The study is build your own, which might be a little problematic
        "spice-kitchen"
    ]

    full_data = {}

    # create the driver along with options (to run window scraper silently)
    options = Options()
    options.add_experimental_option("detach", True)
    options.add_argument("--headless")

    driver = webdriver.Chrome(options=options)

    for name in dining_halls:
        driver.get(f'https://dining.ucla.edu/{name}/')

        menu_data = {}
        meal_anchor_info = {
            "breakfastmenu": "BREAKFAST",
            "lunchmenu": "LUNCH",
            "dinnermenu": "DINNER"
        }

        for anchor_id, period_name_friendly in meal_anchor_info.items():
            try:
                print(f"\nProcessing meal period: {period_name_friendly} for {name} -- (anchor ID: {anchor_id})", file=sys.stderr)
                
                # Locate the anchor div by its ID
                wait = WebDriverWait(driver, 0.2) # forcefully wait
                anchor_element = wait.until(EC.presence_of_element_located((By.ID, anchor_id)))
                # print(f"  Found anchor element: {anchor_id}")

                # fetch content of meal container (the div immediately after)
                meal_content_container = anchor_element.find_element(By.XPATH, "./following-sibling::div[1]")
                
                if meal_content_container:
                    # print(f"  Found content container for {period_name_friendly}")
                    menu_data[period_name_friendly] = {}
                    
                    # parse inner HTML
                    soup = BeautifulSoup(meal_content_container.get_attribute('outerHTML'), 'html.parser')
                    sub_category_sections = soup.find_all(
                        'div',
                        class_='force-left-full-width',
                        id=lambda x: x and x.startswith(period_name_friendly.lower())
                    )
                    
                    # Fallback if the ID naming convention isn't strictly "mealname-category"
                    if not sub_category_sections:
                        print(f"  No sub-categories found with '{period_name_friendly.lower()}' prefix in ID. Trying generic 'force-left-full-width'.", file=sys.stderr)
                        sub_category_sections = soup.find_all('div', class_='force-left-full-width', id=True)

                    if not sub_category_sections:
                        print(f"  No sub-category sections (div.force-left-full-width with an id) found within the content for {period_name_friendly}.", file=sys.stderr)
                        continue

                    for section_div in sub_category_sections:
                        # Extract sub-category name from the h2 inside .cat-heading-box
                        sub_cat_name_tag = section_div.select_one('.cat-heading-box .category-heading h2')
                        if not sub_cat_name_tag: # Fallback: try to find any h2 in the section_div
                            sub_cat_name_tag = section_div.find('h2')
                        
                        sub_category_name = sub_cat_name_tag.get_text(strip=True) if sub_cat_name_tag else "Unknown Category"
                        
                        # If sub_category_name is still the meal period name (e.g. "BREAKFAST"), try to get a better one from ID
                        if sub_category_name.upper() == period_name_friendly:
                            section_id = section_div.get('id', '')
                            if section_id.startswith(period_name_friendly.lower() + "-"):
                                sub_category_name = section_id.split('-', 1)[1].replace('-', ' ').title()


                        menu_data[period_name_friendly][sub_category_name] = []
                        # print(f"Parsing sub-category: {sub_category_name}")

                        # Find all recipe cards in this sub-category
                        recipe_cards = section_div.find_all('section', class_='recipe-card')
                        if not recipe_cards:
                            print(f"No recipe cards found in '{sub_category_name}'.", file=sys.stderr)

                        for card in recipe_cards:
                            item_name_tag = card.select_one('.menu-item-title .ucla-prose h3')
                            if item_name_tag:
                                item_name = item_name_tag.get_text(strip=True)
                                menu_data[period_name_friendly][sub_category_name].append(item_name)
                                # print(f"        Added item: {item_name}")
                            else:
                                print(f"Could not find item name (h3) in a recipe card within '{sub_category_name}'.", file=sys.stderr)
                else:
                    print(f"  Could not find content container immediately following anchor: {anchor_id}", file=sys.stderr)

            except TimeoutException:
                print(f"  Could not find meals for section: {anchor_id}", file=sys.stderr)
            except Exception as e:
                print(f"  An unexpected error occurred while processing {period_name_friendly} (anchor ID: {anchor_id}): {e}", file=sys.stderr)
                import traceback
                traceback.print_exc()
                
        full_data[name] = menu_data
        if menu_data == {}:
            print(f'{name} IS EITHER CLOSED OR ERROR FOUND', file=sys.stderr)
            
    return full_data

def main():
    data = fetch_dining_data()
    print(json.dumps(data, separators=(',',':')))

if __name__ == '__main__':
    main()