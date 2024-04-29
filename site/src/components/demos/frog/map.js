$(function () {
  var $image = $('#frog-img'),
    opts = {
      enableAutoResizeSupport: true,
      autoResize: true,
      mapKey: 'data-name',
      singleSelect: true,
      altImage:
        'https://raw.githubusercontent.com/jamietre/ImageMapster/main/examples/images/frog_map_alt.jpg',
      altImageOpacity: 0.8,
      fillOpacity: 0.5,
      fillColor: 'f4ff75',
      areas: [
        {
          key: 'menu1hot',
          staticState: false,
          includeKeys: 'menu1'
        },
        {
          key: 'menu2hot',
          staticState: false,
          includeKeys: 'menu2'
        },
        {
          key: 'menu3hot',
          staticState: false,
          includeKeys: 'menu3'
        },
        {
          key: 'menu4hot',
          staticState: false,
          includeKeys: 'menu4'
        }
      ]
    };

  $image.mapster(opts);
});
