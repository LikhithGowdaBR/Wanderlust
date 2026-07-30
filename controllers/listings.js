const Listing = require("../models/listing");
const axios = require("axios");

module.exports.index = async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};
  const allListings = await Listing.find(filter);
  res.render("listings/index.ejs", {
    allListings,
    selectedCategory: category || "All",
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "The listing you requested could not be found.");
    return res.redirect("/listings");
  }

  let mapCoords = null;
  try {
    const geoRes = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: `${listing.location}, ${listing.country}`,
          format: "jsonv2",
          limit: 1,
        },
        headers: {
          "User-Agent": "wanderlust-app",
        },
      },
    );

    if (geoRes.data && geoRes.data.length > 0) {
      mapCoords = {
        lat: parseFloat(geoRes.data[0].lat),
        lon: parseFloat(geoRes.data[0].lon),
      };
    }
  } catch (err) {
    console.log("Map geocoding failed:", err.message);
  }

  res.render("listings/show.ejs", { listing, mapCoords });
};

module.exports.createListing = async (req, res, next) => {
  // let { title, description, image, price, country, location } = req.body;
  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "The listing you requested could not be found.");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }); //deconstruction to individual value
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
