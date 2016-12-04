(function() {

  var searchColor = document.getElementById('search-color');

  var headerColored = document.getElementById('header-colored');
  searchColor.addEventListener('input', function() {
    headerColored.style.color = searchColor.value;
    document.getElementById('progress-value').style.backgroundColor = searchColor.value;
  });

  var controlsAdvanced = document.getElementById('controls-advanced');
  var controlsAdvToggle = document.getElementById('controls-advanced-toggle');
  var controlsAdvToggled = false;
  controlsAdvToggle.addEventListener('mouseenter', function() {
    controlsAdvToggle.style.fontSize = '1.45em';
    if (!controlsAdvToggled)
      controlsAdvToggle.style.color = searchColor.value;
  });
  controlsAdvToggle.addEventListener('mouseleave', function() {
    controlsAdvToggle.style.fontSize = '1.33em';
    if (!controlsAdvToggled)
      controlsAdvToggle.style.color = '#000';
  });
  controlsAdvToggle.addEventListener('click', function() {
    if (controlsAdvToggled) {
      controlsAdvanced.style.display = 'none';
      controlsAdvToggle.style.color = '#000';
      controlsAdvToggled = false;
    }
    else {
      controlsAdvanced.style.display = 'block';
      controlsAdvToggle.style.color = searchColor.value;
      controlsAdvToggled = true;
    }
  });

  var kMeansK = document.getElementById('search-km-k');
  var kMeansKDisplay = document.getElementById('search-km-k-display');
  kMeansK.addEventListener('input', function() {
    kMeansKDisplay.innerText = '(' + kMeansK.value + ')';
  });
  var thrT = document.getElementById('search-thr');
  var thrTDisplay = document.getElementById('search-thr-display');
  thrT.addEventListener('input', function() {
    var thrTMeaning = null;
    if (thrT.value <=1)
      thrTMeaning = 'normally invisible difference.';
    else if (thrT.value <= 2)
      thrTMeaning = 'very small difference, only obvious to a trained eye.';
    else if (thrT.value <= 3.5)
      thrTMeaning = 'medium difference, also obvious to an untrained eye.';
    else if (thrT.value <= 5)
      thrTMeaning = 'obvious difference.';
    else
      thrTMeaning = 'very obvious difference.';
    thrTDisplay.innerText = '(' + thrT.value + ' ~ ' + thrTMeaning + ')';
  });

  var searchSubmit = document.getElementById('search-submit');
  searchSubmit.addEventListener('click', search);

  var itemsProcessed = 0;
  var itemsTotal = 0;

  function search() {
    var searchText = document.getElementById('search-text').value;

    itemsProcessed = 0;
    itemsTotal = 0;
    document.getElementById('results').innerHTML = '';
    document.getElementById('progress-bar').style.display = 'initial'
    document.getElementById('progress-value').style.display = 'initial';

    var request = new XMLHttpRequest();
    request.addEventListener('readystatechange', getResults);
    request.open("GET", '/search?text=' + searchText, true);
    request.send();
  }

  function getResults() {
    if (this.readyState == 4 && this.status == 200) {
      results = JSON.parse(this.responseText);
      results.forEach(similarityOrder);
      itemsTotal = results.length;
    }
  }

  function similarityOrder(result) {
    searchColor = document.getElementById('search-color').value;

    var farmId = result.farm_id;
    var serverId = result.server_id;
    var id = result.id;
    var secret = result.secret;

    var thumbnailUrl = 'https://farm' + farmId + '.staticflickr.com/' + serverId + '/' + id + '_' + secret + '_m.jpg';
    var photoUrl = 'https://farm' + farmId + '.staticflickr.com/' + serverId + '/' + id + '_' + secret + '_h.jpg';

    var requestUrl = '/similarity?id=' + id + '&url=' + thumbnailUrl + '&color=' + encodeURIComponent(searchColor);

    var request = new XMLHttpRequest();
    request.addEventListener('readystatechange', function() {
      if (this.readyState == 4 && this.status == 200) {
        displayImage(JSON.parse(this.responseText), photoUrl);
      }
    });
    request.open("GET", requestUrl, true);
    request.send();
  }

  function displayImage(similarity, photoUrl) {
    itemsProcessed++;
    progressValue = document.getElementById('progress-value');
    progressValue.style.width = ((itemsProcessed / itemsTotal) * 100) + '%';

    var resultList = document.getElementById('results');
    var resultItems = resultList.getElementsByTagName('li');

    // TODO: undo
    var newListItem = document.createElement('li');
    var imgWrapper = document.createElement('div');
    imgWrapper.className = 'image-wrapper';
    imgWrapper.style.width = '200px';
    imgWrapper.style.height = '200px';
    imgWrapper.style.textAlign = 'center';
    imgWrapper.style.margin = '0 0.2em 0.2em 0.2em';
    imgWrapper.style.overflow = 'hidden';
    var img = document.createElement('div');
    img.className = 'image';
    img.style.backgroundImage = "url('" + photoUrl + "')";
    //img.title = similarity.deltaE;
    var imgMeta = document.createElement('p');
    imgMeta.style.height = '12px';
    imgMeta.style.width = '200px';
    imgMeta.style.textAlign = 'center';
    imgMeta.style.margin = 0;
    var imgMetaDelta = document.createElement('span');
    imgMetaDelta.className = 'img-meta';
    var delta = document.createTextNode('Δ ');
    var deltaValue = document.createElement('span');
    deltaValue.className = 'similarity';
    deltaValue.innerText = similarity.deltaE.toFixed(2);
    var imgMetaPercent = document.createElement('span');
    imgMetaPercent.className = 'img-meta';
    var percent = document.createTextNode('% ');
    var percentValue = document.createElement('span');
    percentValue.className = 'percentage';
    percentValue.innerText = similarity.percentage.toFixed(2);

    imgMetaDelta.appendChild(delta);
    imgMetaDelta.appendChild(deltaValue);
    imgMetaPercent.appendChild(percent);
    imgMetaPercent.appendChild(percentValue);
    imgMeta.appendChild(imgMetaDelta);
    imgMeta.appendChild(imgMetaPercent);
    imgWrapper.appendChild(img);
    imgWrapper.appendChild(imgMeta);
    newListItem.appendChild(imgWrapper);

    img.addEventListener('mouseenter', function() {
      var searchColor = document.getElementById('search-color').value
      img.style.boxShadow = '0 0 0 0.15em ' + searchColor + ' inset';
      img.style.height = '184px';
    })
    img.addEventListener('mouseleave', function() {
      img.style.boxShadow = 'none';
      img.style.height = '200px';
    })

    if (resultItems.length == 0) {
      resultList.appendChild(newListItem);
    }
    else {
      var flag = false;
      for (var i = 0; i < resultItems.length; i++) {
        if (similarity.deltaE < parseFloat(resultItems[i].childNodes[0].childNodes[1].childNodes[0].childNodes[1].innerText)) {
          resultList.insertBefore(newListItem, resultItems[i]);
          flag = true;
          break;
        }
      }
      if (!flag) resultList.appendChild(newListItem);
    }

    if (itemsProcessed == itemsTotal) {
      document.getElementById('progress-bar').style.display = 'none';
      document.getElementById('progress-value').style.display = 'none';
    }
  }

})();
