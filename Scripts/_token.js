
let actionCode = {
    Insert: 1,
    Delete: -1,
    DeleteAll: -2,
    Update: 100,
    Download: 1000,
    Refresh: 2,
    Find: 3,
    Filter: 4,
    Detail: 5,
    result: function (obj) {
        return obj;
    },

    getFindData: function (obj) {
        return { code: this.Find, _id: obj._id }
    },
    getDeleteData: function (obj) {
        return this.result({ code: this.Delete, _id: obj._id })
    },
    getInsertData: function (obj) {
        return this.result({ code: this.Insert, value: obj })
    },
    getUpdateData: function (obj, ins) {
        return this.result({ code: ins ? this.Insert : this.Update, _id: obj._id, value: obj })
    },
}

let api = {
    error: {},
    download: function (url, value, download, errorCallback) {
        this.post(url, value, v => {
            toast.success("Downloading ...");

            if (download) { v.dst = download }
            $action("/token/download", v).post();

        }, errorCallback);
    },
    progress: null,
    error: function (code, message) {
        toast.error(message);
    },
    success: null,

    callback: function () {},
    send: function (url, method, data, successCallback) {
        var http = new XMLHttpRequest();
        http.onload = function () {
            var e = JSON.parse(http.response);
            api.callback(e);

            if (e.code) {
                api.error(e.code, e.message);
            } else {
                if (api.success) api.success(e.value, e.message);
                if (successCallback) {
                    successCallback(e.value, e.message);
                }
            }
        }
        if (api.progress) {
            http.addEventListener("progress", function (event) {
                api.progress(event.total, event.loaded);
            });
        }

        if (!data) {
            data = {};
        }

        http.open(method, url)
        http.setRequestHeader('Content-type', 'application/json')
        http.send(JSON.stringify(data))
    }
}


/*************** STORAGE ***************/
let cookie = {
    set: function (name, value, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + ((exdays ?? 1) * 24 * 60 * 60 * 1000));

        let expires = "expires=" + d.toUTCString();
        let cvalue = (typeof value === "string" ? value : JSON.stringify(value));
        document.cookie = name + "=" + cvalue + ";" + expires + ";path=/";
    },
    get: function (name) {
        let cname = name + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(cname) == 0) {
                let s = c.substring(cname.length, c.length);
                return s;
            }
        }
        return "";
    },
    getObject: function (name, callback) {
        let o = null;
        let s = this.get(name);

        if (s) {
            try {
                o = JSON.parse(s);
            } catch {
            }
        }

        if (callback) { callback(o) }
        return o;
    },
    remove: function (name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    },
}

let session = {
    message: "Session time out",
    timeout: 20,
    remain: 0,
    set: function (name, value) {
        let data = (typeof value === "string" ? value : JSON.stringify(value));
        sessionStorage.setItem(name, data);
    },
    get: function (name) {
        return sessionStorage.getItem(name);
    },
    getObject: function (name, callback) {
        let s = sessionStorage.getItem(name);
        let o = !s ? {} : JSON.parse(s);

        if (callback) { callback(o) }
        return o;
    },
    getArray: function (name, callback) {
        let s = sessionStorage.getItem(name);
        let a = !s ? [] : JSON.parse(s);

        if (callback) { callback(a) }
        return a;

    },
    login: function (info) {
        this.set("user", user = info);
        return this;
    },
    token: function (v) {
        if (arguments.length == 0)
            return this.get("token");

        this.set("token", v);
        return this;
    },
    updateProfile: function (v) {
        this.call("myprofile", v, () => {
            user.profile = v;
            this.set("user", user);
            redirect("/home")
        });
    },
    restart: function () {
        this.remain = this.timeout;
    },
    start: function (mins) {

        //console.log(user);

        //if (!mins) {
        //    mins = this.timeout;
        //}
        //if (mins) {
        //    //let clock = $("<div class='session-clock' />").appendTo(document.body)

        //    this.remain = this.timeout = mins;

        //    //clock.html(this.remain)
        //    let counter = setInterval(() => {
        //        if (--this.remain == 0) {
        //            clearInterval(counter);
        //            session.end();
        //        }

        //        //clock.html(this.remain)

        //    }, 60 * 1000);
        //}
        session.ready();
        return this;
    },
    ready: function () { },
    end: function (url) {
        sessionStorage.clear("user");
        api.post("account/logout", { "token": session.token },
            function () { if (url) redirect(url) },
            function () { })

        if (!url) {
            let dlg = $("<div><h5>System</h5><section><p>" + this.message + "</p></section></div>")
                .card("warning")
                .dialog();

            dlg.closing = function () {
                redirect("/login");
            }
        }
    },
    call: function (action, value, successCallback, errorCallback) {
        api.post(user.Role + "/" + action, value ?? {}, successCallback, errorCallback);
    },
    async: function (waitTarget, prog, action, value, successCallback, errorCallback) {
        let content = $(waitTarget);
        let childs = content.children().each(function () { this.remove() });

        if (!prog) {
            prog = $("<span class='fa fa-spinner fa-spin'></span>")
        }
        prog.appendTo(content);

        function end() {
            prog.remove();
            content.append(childs);
        }
        this.call(action, value, v => {
            end();
            if (successCallback) successCallback(v);
        }, m => {
            end();
            if (errorCallback) {
                errorCallback;
            } else {
                toast.error(m);
            }
        });
    },

    loading: function (target, action, value, successCallback) {
        let div = $("<div class='data-loading'><span class='fa fa-spinner fa-spin'></span> loading...</div>")
        this.async(target, div, action, value, successCallback);
    },
    upload: function (action, path, file, progContent, completedCallback) {
        let reader = new FileReader();
        let prog = $progressBar();
        //let childs = $(progContent).children().each(function () { this.remove() })
        //prog.appendTo(progContent);

        let old = api.onprogress;
        reader.onload = function () {
            let s = reader.result;
            prog.total(s.length);

            s = s.substr(s.indexOf(',') + 1);

            api.onprogress = function (t, v) {
                prog.val(v);
            }
            session.async(progContent, prog, action, {
                code: actionCode.Insert,
                value: s,
                path: path + '/' + file.name,
            }, () => {
                prog.val(s.length);
                api.onprogress = old;

                if (completedCallback) {
                    completedCallback();
                }

            }, () => api.onprogress = old)
        }
        prog.wait(100, () => {
            reader.readAsDataURL(file);
        })
    },
    download: function (data, filename, type) {
        let a = document.createElement("a");
        a.download = filename;

        if (type) {
            let blob = new Blob([data], {
                type: "application/" + type,
            });
            a.href = URL.createObjectURL(blob);
        }
        else {
            a.href = data;
        }

        document.body.appendChild(a);
        a.click();
        a.remove();
    },
}

let actor = {
    action: "",
    begin: function (a) { this.action = a; return this; },

    url: function (a) {
        let s = this.action;
        if (a) {
            s += '/' + a;
        }
        return s;
    },
    post: function (action, value, successCallback) {
        let data = {
            token: session.token(),
            url: this.url(action),
        }
        if (value) data.value = value;

        api.send("/api/all/", 'POST', data, successCallback);
    },
    get: function (action, id, successCallback) {
        let data = {
            url: this.url(action),
        };
        if (id) {
            if (typeof id === "string") {
                data._id = id;
            }
            else {
                $.extend(data, id, true);
            }
        }

        api.send("/api/all/" + btoa(JSON.stringify(data)), 'GET', null, successCallback)
    },
    delete: function (value, successCallback) {
        this.call('DELETE', value, successCallback)
    },
    update: function (id, value, successCallback) {
        value._id = id;
        this.put(value, successCallback);
    },

    change_pass: function () {
        $form().init("Bảo mật")
            .section("Chọn chế độ bảo mật")
            .add("Checker", "switch", "Chế độ bảo mật đang <b>bật</b>")
            .section("<h6>Khi tắt chế độ bảo mật, có thể đăng nhập hệ thống mà không cần đến mật khẩu</h6>")
            .section("Thông tin bảo mật")
            .add("Password", "password", "Mật khẩu")
            .add("Confirm", "password", "Nhắc lại")
            .val({ Checker: 1 })
            .modal()
            .accept("OK", v => {
                actor.begin("user").post("change-pass", {
                    Password: v.Checker ? v.Password : "",
                }, () => toast.success("Đặt mật khẩu thành công"))
            })


        let ss = form.find("section");
        function updateView() {
            let b = form.Checker.get();

            form.Checker.parent().find("b").html(b ? "bật" : "tắt");

            form.Password.required(b);
            form.Confirm.required(b);

            ss[1].hidden = b;
            ss[2].hidden = !b;
        }
        form.Checker.change(updateView)
        form.Password.change(function () {
            form.Confirm.set("");
        })
        form.Confirm.change(function () {
            let b = form.Password.get() != form.Confirm.get();
            if (b) {
                toast.warning("Mật khẩu không khớp");
            }
            form.find("button").prop("disabled", b);
        })

        updateView();
    }
}