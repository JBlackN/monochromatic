(function() {

  var searchSubmit = document.getElementById('search-submit');
  searchSubmit.addEventListener('click', search);

  function search() {
    var searchText = document.getElementById('search-text').value;

    document.getElementById('results').innerHTML = '';
    document.getElementById('info-processed').innerText = 0;
    document.getElementById('info-total').innerText = 0;

    var request = new XMLHttpRequest();
    request.addEventListener('readystatechange', getResults);
    request.open("GET", '/search?text=' + searchText, true);
    request.send();
  }

  function getResults() {
    if (this.readyState == 4 && this.status == 200) {
      results = JSON.parse(this.responseText);
      results.forEach(similarityOrder);

      document.getElementById('info-total').innerText = results.length;
    }
  }

  function similarityOrder(result) {
    var searchColor = document.getElementById('search-color').value;

    var farmId = result.farm_id;
    var serverId = result.server_id;
    var id = result.id;
    var secret = result.secret;

    var thumbnailUrl = 'https://farm' + farmId + '.staticflickr.com/' + serverId + '/' + id + '_' + secret + '_m.jpg';

    var requestUrl = '/similarity?id=' + id + '&url=' + thumbnailUrl + '&color=' + encodeURIComponent(searchColor);

    var request = new XMLHttpRequest();
    request.addEventListener('readystatechange', function() {
      if (this.readyState == 4 && this.status == 200) {
        displayImage(JSON.parse(this.responseText), thumbnailUrl);
      }
    });
    request.open("GET", requestUrl, true);
    request.send();
  }

  function displayImage(similarity, thumbnailUrl) {
    console.log(similarity);
    document.getElementById('info-processed').innerText++;

    var resultList = document.getElementById('results');
    var resultItems = resultList.getElementsByTagName('li');

    var newListItem = document.createElement('li');
    var img = document.createElement('img');
    img.src = thumbnailUrl;
    img.title = similarity.deltaE;
    newListItem.appendChild(img);

    if (resultItems.length == 0) {
      resultList.appendChild(newListItem);
    }
    else {
      var flag = false;
      for (var i = 0; i < resultItems.length; i++) {
        if (similarity.deltaE < parseFloat(resultItems[i].childNodes[0].title)) {
          resultList.insertBefore(newListItem, resultItems[i]);
          flag = true;
          break;
        }
      }
      if (!flag) resultList.appendChild(newListItem);
    }
  }

})();
