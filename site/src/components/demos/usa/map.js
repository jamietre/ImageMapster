$(function () {
  var $image = $('#usa-img'),
    opts = {
      enableAutoResizeSupport: true,
      autoResize: true,
      configTimeout: 30000,
      fillOpacity: 0.5,
      render_highlight: {
        fillColor: '2aff00',
        stroke: true,
        altImage: `https://raw.githubusercontent.com/jamietre/ImageMapster/master/examples/images/usa_map_720_alt_4.jpg`
      },
      render_select: {
        fillColor: 'ff000c',
        stroke: false,
        altImage: `https://raw.githubusercontent.com/jamietre/ImageMapster/master/examples/images/usa_map_720_alt_5.jpg`
      },
      fadeInterval: 50,
      mapKey: 'data-state',
      areas: [
        {
          key: 'TX',
          selected: true
        },
        {
          key: 'ME',
          selected: true
        },
        {
          key: 'WA',
          staticState: false
        },
        {
          key: 'OR',
          isSelectable: false
        }
      ]
    };

  $image.mapster(opts);
});
