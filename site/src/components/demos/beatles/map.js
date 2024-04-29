$(function () {
  // Set up some options objects: 'single_opts' for when a single area is selected, which will show just a border
  // 'all_opts' for when all are highlighted, to use a different effect - shaded white with a white border
  // 'initial_opts' for general options that apply to the whole mapster. 'initial_opts' also includes callbacks
  // onMouseover and onMouseout, which are fired when an area is entered or left. We will use these to show or
  // remove the captions, and also set a flag to let the other code know if we're currently in an area.
  var inArea = false,
    $image = $('#beatles-img'),
    $captionBandMember = $('#beatles-caption-band-member'),
    $captionInstructions = $('#beatles-caption-instructions'),
    $captionHeader = $('#beatles-caption-header'),
    $captionText = $('#beatles-caption-text'),
    captions = {
      paul: [
        'Paul McCartney - Bass Guitar and Vocals',
        "Paul McCartney's song, Yesterday, recently voted the most popular song " +
          'of the century by a BBC poll, was initially composed without lyrics. ' +
          "Paul used the working title 'scrambled eggs' before coming up with the final words."
      ],
      ringo: [
        'Ringo Starr - Drums',
        "Dear Prudence was written by John and Paul about Mia Farrow's sister, Prudence, " +
          "when she wouldn't come out and play with Mia and the Beatles at a religious retreat " +
          'in India.'
      ],
      john: [
        'John Lennon - Guitar and Vocals',
        "In 1962, The Beatles won the Mersyside Newspaper's biggest band in Liverpool " +
          'contest principally because they called in posing as different people and voted ' +
          'for themselves numerous times.'
      ],
      george: [
        'George Harrison - Lead Guitar and Vocals',
        "The Beatles' last public concert was held in San Francisco's Candlestick " +
          'Park on August 29, 1966.'
      ]
    },
    single_opts = {
      fillColor: '000000',
      fillOpacity: 0,
      stroke: true,
      strokeColor: 'ff0000',
      strokeWidth: 2
    },
    all_opts = {
      fillColor: 'ffffff',
      fillOpacity: 0.6,
      stroke: true,
      strokeWidth: 2,
      strokeColor: 'ffffff'
    },
    initial_opts = {
      enableAutoResizeSupport: true,
      autoResize: true,
      mapKey: 'data-name',
      isSelectable: false,
      onMouseover: function (data) {
        inArea = true;
        $captionHeader.text(captions[data.key][0]);
        $captionText.text(captions[data.key][1]);
        $captionInstructions.hide();
        $captionBandMember.show();
      },
      onMouseout: function () {
        inArea = false;
        $captionBandMember.hide();
        $captionInstructions.show();
      }
    },
    opts = $.extend({}, initial_opts, single_opts);

  // Bind to the image 'mouseover' and 'mouseout' events to activate or deactivate ALL the areas, like the
  // original demo. Check whether an area has been activated with "inArea" - IE&lt;9 fires "onmouseover"
  // again for the image when entering an area, so all areas would stay highlighted when entering
  // a specific area in those browsers otherwise. It makes no difference for other browsers.

  $image
    .mapster(opts)
    .on('mouseover', function () {
      if (!inArea) {
        $image
          .mapster('set_options', all_opts)
          .mapster('set', true, 'all')
          .mapster('set_options', single_opts);
      }
    })
    .on('mouseout', function () {
      if (!inArea) {
        $image.mapster('set', false, 'all');
      }
    });
});
