var drop_down_value, drop_down_text, user_id, user_name;
function logout() {
    chrome.storage.local.remove(['user_id', 'user_name', 'html_content', 'drop_down_text', 'per_page', 'page'], function () {
        window.location = "newtab.html";
    });
}
function create_list(user_id, shelf = null, per_page = "50", page = "1", cb = null) {
    chrome.runtime.sendMessage({ new_tab: "yes", user_id: user_id, shelf: shelf, page: page, per_page: per_page }, function (response) {
        if (response.error) {
            window.alert("Invalid Details!");
            logout();
            return;
        }
        var html_content = '<div class="row align-items-center justify-content-center">';
        for (let k = 0; k < response.data.length; k++) {
            html_content += '<div class="col-md-2 align-self-center text-center"><a href="'+response.data[k]['link']+'"><img src=' + response.data[k]["image_url"] + ' class="rounded image_blocks hover-shadow" data-toggle="tooltip" title=' + '"' + response.data[k]["title"] + '"' + '></img></a></div>'
            if (k && (k + 1) % 6 === 0 && (k !== response.data.length - 1)) {
                html_content += '</div><br><br><div class="row">'
            }
            else if (k == response.data.length) {
                html_content += '</div>'
            }
        }
        chrome.storage.local.set({ "html_content": html_content }, function () {
            console.log("data caching done");
            document.getElementById("content").innerHTML = html_content;
            if (cb) {
                cb();
            }
        });
    });
}
$(document).ready(function () {
    chrome.storage.local.get(['user_id', 'user_name', 'html_content'], function (result) {
        if (result.hasOwnProperty('user_id') && result.hasOwnProperty('user_name')) {
            user_id = result['user_id'];
            user_name = result['user_name'];
            if (result.hasOwnProperty('html_content')) {
                document.getElementById("content").innerHTML = result['html_content'];
                document.getElementById("user_submit").innerHTML = "Go";
                $("#r3").hide();
                $("#r4").hide();
                document.getElementById("heading_id").innerHTML = "Welcome, " + user_name;
                $("#r1").show();
                $("#r2").show();
            }
            else {
                create_list(user_id, null, "50", "1", function () {
                    document.getElementById("user_submit").innerHTML = "Go";
                    $("#r3").hide();
                    $("#r4").hide();
                    document.getElementById("heading_id").innerHTML = "Welcome, " + user_name;
                    $("#r1").show();
                    $("#r2").show();
                });
            }
        }
        else {
            $("#r4").hide();
            $("#r3").show();
        }
    });
    $("#user_submit").click(function () {
        user_id = $("#user_id").val();
        user_name = $("#user_name").val();
        chrome.storage.local.set({ "user_id": user_id, "user_name": user_name }, function () {
            console.log("values set-> user_id: " + user_id + " user_name: " + user_name);
            $("#user_submit").prop("disabled",true);
            document.getElementById("user_submit").innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
            create_list(user_id, null, "50", "1", function () {
                document.getElementById("user_submit").innerHTML = "Go";
                $("#user_submit").prop("disabled",false);
                document.getElementById("heading_id").innerHTML = "Welcome, " + user_name;
                $("#r3").hide();
                $("#r1").show();
                $("#r2").show();
            });
        });
    });
    $("#shelf_dropdown a").click(function () {
        drop_down_text = $(this).text();
        drop_down_value = $(this).attr("value");
        $("#shelf_text").text(drop_down_text);
    });
    $("#modal_submit").click(function () {
        var per_page = $("#book_number").val();
        var page = $("#page_number").val();
        $("#modal_submit").prop("disabled",true);
        chrome.storage.local.set({ "drop_down_text": drop_down_text, "per_page": per_page, "page": page }, function () {
            document.getElementById("modal_submit").innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
            create_list(user_id, drop_down_value, per_page, page, function () {
                document.getElementById("modal_submit").innerHTML = "OK";
                $("#modal_submit").prop("disabled",false);
                $("#myModal").modal("hide");
            });
        });
    });
    $("#open_modal").click(function () {
        chrome.storage.local.get(['drop_down_text', 'per_page', 'page'], function (result) {
            if (result.hasOwnProperty("drop_down_text") && result.hasOwnProperty("per_page") && result.hasOwnProperty("page")) {
                $("#shelf_text").text(result['drop_down_text']);
                $("#book_number").val(result['per_page']);
                $("#page_number").val(result['page']);
            }
        });
    });
    $("#logout_button").click(function () {
        logout();
    });
});