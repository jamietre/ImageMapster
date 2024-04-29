$(function () {
  var $image = $('#resize-img'),
    opts = {
      mapKey: 'data-title',
      stroke: true,
      strokeWidth: 2,
      strokeColor: 'ff0000'
    };
  $image.mapster(opts);

  $('#make-small').on('click', function () {
    $image.mapster('resize', 200, 0, 1000);
  });
  $('#make-big').on('click', function () {
    $image.mapster('resize', 720, 0, 1000);
  });
  $('#make-any').on('click', function () {
    $image.mapster('resize', $('#new-size').val(), 0, 1000);
  });
});
