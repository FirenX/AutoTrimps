oldDate = Date;
Date = function () {
  var currDate = new oldDate();
  return new oldDate(currDate.getTime() * 10);
}
