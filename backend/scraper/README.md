# Scraper

This folder contains the scraper that will be used to extract necessary information about foods being served at the dining hall, sourced from the [UCLA Dining Hall Website](https://dining.ucla.edu/)

> **NOTE:** This scraper is currently under development. Its capabilities are limited for now

## Running the Scraper

1. Install necessary libraries

```
pip install selenium
pip install beautifulsoup4
```

2. Run scraper
This will later be set up to be fully integrated to our backend and frontend. The current version is a rushed version in order to get the rest of the team some test data to play around with. 

```
python scraper.py
```

## Reading the Data

The data from this scraper is a json, where every dining hall name serves as a key:

```
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
    # "the-study-at-hedrick" # The study is build your own, which might be a little problematic
    "spice-kitchen"
]
```

Each dining hall is split up into "BREAKFAST", "LUNCH", and "DINNER" sections (if they exist). Within each section, we have listed the different categories of foods, followed by a list of the food names. 

An example of parsing this dictionary is:
```
print(full_data['bruin-plate']['BREAKFAST']['Harvest'])
['Chayote, Tri-Tip & Egg Bowl', 'Scrambled Eggs', 'Scrambled Egg Whites', 'Vegan Scrambled Eggs', 'Roasted Red Breakfast Potato Wedges']
```

## Known Bugs

* Dining halls such as The Drey store their data under a single div called "breakfastmenu" which is misleading, because the actual text of that div is "Lunch / Dinner." We will have to address that dynamically
* Food trucks require a special parsing due to different page layout