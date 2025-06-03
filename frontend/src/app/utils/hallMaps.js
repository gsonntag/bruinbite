export const hallApiNameToDisplayName = {
    "bruin-cafe": "Bruin Café",
    "bruin-plate": "Bruin Plate",
    "cafe-1919": "Café 1919",
    "de-neve-dining": "De Neve",
    "the-drey": "The Drey",
    "epicuria-at-covel": "Epicuria",
    "epicuria-at-ackerman": "Epic at Ackerman",
    "rendezvous": "Rendezvous",
    "the-study-at-hedrick": "The Study",
    "spice-kitchen": "Spice Kitchen at Bruin Bowl"
};

export const displayNameToApiName = Object.fromEntries(
    Object.entries(hallApiNameToDisplayName).map(([api, display]) => [display, api])
);

export const getDisplayName = (apiName) => {
    return hallApiNameToDisplayName[apiName] || apiName;
};

export const getApiName = (displayName) => {
    return displayNameToApiName[displayName] || displayName;
}; 