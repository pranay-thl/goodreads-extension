function xmlToJson(xml) {

    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
    }

    // do children
    // If just one text node inside
    if (xml.hasChildNodes() && xml.childNodes.length === 1 && xml.childNodes[0].nodeType === 3) {
        obj = xml.childNodes[0].nodeValue;
    }
    else if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        //console.log(request);
        if (request.new_tab === "yes") {
            var xhr = new XMLHttpRequest();
            let request_str = "https://www.goodreads.com/review/list?v=2&id=" + request.user_id + "&key=pmZqeolw9HySmphhPnp7NA&per_page=50";
            if (request.shelf && (["currently-reading", "to-read", "read"].indexOf(request.shelf) > -1)) {
                request_str += ("&shelf=" + request.shelf);
            }
            try {
                if (parseInt(request.per_page) >= 1) {
                    request_str += ("&per_page=" + Math.min(parseInt(request.per_page), 200).toString());
                }
                if (parseInt(request.page) >= 1) {
                    request_str += ("&page=" + request.page);
                }
            }
            catch (e) {
                console.log(e);
            }
            xhr.open("GET", request_str, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status !== 200) {
                        console.log(xhr.statusText);
                        sendResponse({ error: xhr.statusText });
                        return;
                    }
                    var resp = xhr.responseXML;
                    var return_data = [];
                    try {
                        var json_data = xmlToJson(resp);
                        //console.log(json_data);
                        let total_iter = parseInt(json_data["GoodreadsResponse"]["reviews"]["@attributes"]["end"]) - parseInt(json_data["GoodreadsResponse"]["reviews"]["@attributes"]["start"]) + 1;
                        for (let k = 0; k < total_iter; k++) {
                            let append_data = {};
                            if (total_iter === 1) {
                                var book_data = json_data["GoodreadsResponse"]["reviews"]["review"]["book"];
                            }
                            else {
                                var book_data = json_data["GoodreadsResponse"]["reviews"]["review"][k]["book"];
                            }
                            append_data["image_url"] = book_data["image_url"];
                            append_data["isbn"] = book_data["isbn"];
                            append_data["link"] = book_data["link"];
                            append_data["title"] = book_data["title"];
                            return_data.push(append_data);
                        }
                    }
                    catch (e) {
                        console.log(e);
                    }
                    sendResponse({ data: return_data });
                }
            }
            xhr.send();
            return true;
        }
    });
chrome.browserAction.onClicked.addListener(
    function () {
        chrome.tabs.create({url: 'newtab.html'});
    });