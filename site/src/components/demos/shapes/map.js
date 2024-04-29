$(function () {
  var $image = $('#shapes-img'),
    opts = {
      enableAutoResizeSupport: true,
      autoResize: true,
      noHrefIsMask: false,
      fillColor: '0a7a0a',
      fillOpacity: 0.7,
      mapKey: 'data-group',
      strokeWidth: 2,
      stroke: true,
      strokeColor: 'F88017',
      render_select: {
        fillColor: 'adadad'
      },
      areas: [
        {
          key: 'blue-circle',
          includeKeys: 'rectangle',
          stroke: false
        },
        {
          key: 'rectangle',
          stroke: true,
          strokeWidth: 3
        },
        {
          key: 'outer-circle',
          includeKeys: 'inner-circle-mask,outer-circle-mask',
          stroke: true
        },
        {
          key: 'outer-circle-mask',
          isMask: true,
          fillColorMask: 'ff002a'
        },
        {
          key: 'inner-circle-mask',
          fillColorMask: 'ffffff',
          isMask: true
        }
      ]
    };

  $image.mapster(opts);
});
