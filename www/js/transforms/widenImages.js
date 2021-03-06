var maybeWidenImage = require('wikimedia-page-library').WidenImage.maybeWidenImage;
var transformer = require("../transformer");
var utilities = require("../utilities");

var maxStretchRatioAllowedBeforeRequestingHigherResolution = 1.3;

function isGalleryImage(image) {
  return (
      image.width >= 64 &&
      image.hasAttribute('srcset') &&
      image.parentNode.className === "image"
    );
}

function getStretchRatio(image) {
    var widthControllingDiv = utilities.firstDivAncestor(image);
    if (widthControllingDiv) {
        return (widthControllingDiv.offsetWidth / image.naturalWidth);
    }
    return 1.0;
}

function useHigherResolutionImageSrcFromSrcsetIfNecessary(image) {
    if (image.getAttribute('srcset')) {
        var stretchRatio = getStretchRatio(image);
        if (stretchRatio > maxStretchRatioAllowedBeforeRequestingHigherResolution) {
            var srcsetDict = utilities.getDictionaryFromSrcset(image.getAttribute('srcset'));
            /*
            Grab the highest res url from srcset - avoids the complexity of parsing urls
            to retrieve variants - which can get tricky - canonicals have different paths
            than size variants
            */
            var largestSrcsetDictKey = Object.keys(srcsetDict).reduce(function(a, b) {
              return a > b ? a : b;
            });

            image.src = srcsetDict[largestSrcsetDictKey];
        }
    }
}

function onImageLoad() {
    var image = this;
    image.removeEventListener('load', onImageLoad, false);
    if (isGalleryImage(image) && maybeWidenImage(image)) {
        useHigherResolutionImageSrcFromSrcsetIfNecessary(image);
    }
}

transformer.register( "widenImages", function( content ) {
    var images = content.querySelectorAll( 'img' );
    for ( var i = 0; i < images.length; i++ ) {
        // Load event used so images w/o style or inline width/height
        // attributes can still have their size determined reliably.
        images[i].addEventListener('load', onImageLoad, false);
    }
} );
