package models

// https://stackoverflow.com/questions/19335215/what-is-a-slug

type HallSlug string

const (
	DeNeveDining  HallSlug = "de-neve-dining"
	BruinCafe     HallSlug = "bruin-cafe"
	BruinPlate    HallSlug = "bruin-plate"
	Cafe1919      HallSlug = "cafe-1919"
	EpicuriaCovel HallSlug = "epicuria-at-covel"
	EpicuriaAck   HallSlug = "epicuria-at-ackerman"
	Rendezvous    HallSlug = "rendezvous"
	TheDrey       HallSlug = "the-drey"
	SpiceKitchen  HallSlug = "spice-kitchen"
)

var HallNameMap = map[HallSlug]string{
	DeNeveDining:  "De Neve",
	BruinCafe:     "Bruin Cafe",
	BruinPlate:    "Bruin Plate",
	Cafe1919:      "Cafe 1919",
	EpicuriaCovel: "Epicuria",
	EpicuriaAck:   "Epic at Ackerman",
	Rendezvous:    "Rendezvous",
	TheDrey:       "The Drey",
	SpiceKitchen:  "Spice Kitchen at Bruin Bowl",
}
