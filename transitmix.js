! function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = "function" == typeof require && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, l, l.exports, e, t, n, r)
        }
        return n[o].exports
    }
    for (var i = "function" == typeof require && require, o = 0; o < r.length; o++) s(r[o]);
    return s
}({
    1: [function(require, module) {
        var app = require("ampersand-app"),
            keymirror = require("keymirror");
        module.exports = keymirror({
            MAP_LOAD: null,
            MAP_LOAD_COMPLETED: null,
            MAP_CREATE: null,
            MAP_CREATE_COMPLETED: null,
            MAP_DESTROY: null,
            MAP_DESTROY_COMPLETED: null,
            MAP_DUPLICATE: null,
            MAP_DUPLICATE_COMPLETED: null,
            MAP_SELECT: null,
            MAP_SELECT_COMPLETED: null,
            MAP_DESELECT: null,
            MAP_DESELECT_COMPLETED: null,
            LINE_CREATE: null,
            LINE_CREATE_COMPLETED: null,
            LINE_DUPLICATE: null,
            LINE_DUPLICATE_COMPLETED: null,
            LINE_DESTROY: null,
            LINE_DESTROY_COMPLETED: null,
            LINE_SELECT: null,
            LINE_SELECT_COMPLETED: null,
            LINE_DESELECT: null,
            LINE_DESELECT_COMPLETED: null,
            LINE_IMPORT: null,
            LINE_IMPORT_COMPLETED: null,
            LINE_IMPORT_ALL: null,
            LINE_IMPORT_ALL_COMPLETED: null,
            COLORS_SATURATE: null,
            COLORS_DESATURATE: null,
            SANDBOX_START: null
        }), app.on(void 0, function() {
            throw new Error("Calling an undefined action")
        })
    }, {
        "ampersand-app": 60,
        keymirror: 181
    }],
    2: [function(require, module) {
        var Map = require("../models/map"),
            _ = require("underscore"),
            app = require("ampersand-app"),
            config = require("../config"),
            geo = require("../helpers/geo"),
            router = require("../router"),
            xhr = require("xhr");
        module.exports = {
            init: function() {
                app.on(app.actions.MAP_LOAD, this.loadMap, this), app.on(app.actions.MAP_CREATE, this.createMap, this), app.on(app.actions.MAP_DESTROY, this.destroyMap, this), app.on(app.actions.MAP_DUPLICATE, this.duplicateMap, this), app.on(app.actions.LINE_CREATE, this.createLine, this), app.on(app.actions.LINE_DUPLICATE, this.duplicateLine, this), app.on(app.actions.LINE_DESTROY, this.destroyLine, this)
            },
            loadMap: function(options) {
                function onSuccess() {
                    app.maps.remove(options.mapId), app.maps.add(map), app.trigger(app.actions.MAP_LOAD_COMPLETED, options), location.hash.indexOf("hello") > -1 && app.trigger(app.actions.SANDBOX_START)
                }

                function onError() {
                    console.log("Map with id " + options.mapId + " not found."), router.navigate("/", {
                        trigger: !0,
                        replace: !0
                    })
                }
                var map = new Map({
                    id: options.mapId
                });
                map.fetch({
                    success: onSuccess,
                    error: onError,
                    silent: !0
                })
            },
            createMap: function(options) {
                function afterGeocode(results) {
                    function onSuccess(map) {
                        app.maps.add(map), app.trigger(app.actions.MAP_CREATE_COMPLETED, {
                            mapId: map.id
                        })
                    }
                    var map = new Map({
                        city: results.city,
                        center: results.latlng,
                        useMetricUnits: results.useMetricUnits,
                        defaultWindows: _.clone(config.defaults.windows)
                    });
                    map.save({}, {
                        success: onSuccess,
                        silent: !0
                    })
                }
                geo.geocode(options.city, afterGeocode, this)
            },
            destroyMap: function(options) {
                var map = app.maps.get(options.mapId),
                    isSelected = map === app.selectedMap;
                map.destroy(), app.trigger("MAP_DESTROY_COMPLETED", options), isSelected && router.navigate("/", !0)
            },
            duplicateMap: function(options) {
                var request = {
                    url: "/api/maps/" + options.mapId + "/duplicate",
                    method: "POST",
                    json: !0,
                    headers: {
                        "X-CSRF-Token": app.csrf,
                        Accept: "application/json"
                    }
                };
                xhr(request, function(err, resp, attrs) {
                    var duplicated = new Map(attrs, {
                        parse: !0
                    });
                    duplicated.name = "Copy of " + duplicated.name, app.maps.add(duplicated), app.trigger("MAP_DUPLICATE_COMPLETED", {
                        mapId: attrs.id
                    })
                })
            },
            createLine: function() {
                var defaults = {
                    mapId: app.selectedMap.id,
                    windows: app.selectedMap.defaultWindows.serialize()
                };
                this._saveNewLine(defaults, function(line) {
                    app.trigger(app.actions.LINE_CREATE_COMPLETED, {
                        lineId: line.id
                    })
                })
            },
            duplicateLine: function(options) {
                var attrs = app.selectedMap.lines.get(options.lineId).toJSON();
                attrs.duplicatedFromId = options.lineId, attrs.name = "Copy of " + attrs.name, delete attrs.id, this._saveNewLine(attrs, function(line) {
                    app.trigger(app.actions.LINE_DUPLICATE_COMPLETED, {
                        lineId: line.id
                    })
                })
            },
            _saveNewLine: function(attrs, callback) {
                if (app.user && app.user.id === app.selectedMap.authorId) app.selectedMap.lines.create(attrs, {
                    parse: !0,
                    success: callback
                });
                else {
                    var line = app.selectedMap.lines.add(attrs, {
                        parse: !0
                    });
                    line.id = line.cid, callback(line)
                }
            },
            destroyLine: function(options) {
                var line = app.selectedMap.lines.get(options.lineId);
                app.user && app.user.id === app.selectedMap.authorId ? line.destroy() : app.selectedMap.lines.remove(line), app.trigger(app.actions.LINE_DESTROY_COMPLETED)
            }
        }
    }, {
        "../config": 7,
        "../helpers/geo": 9,
        "../models/map": 18,
        "../router": 23,
        "ampersand-app": 60,
        underscore: 189,
        xhr: 190
    }],
    3: [function(require, module) {
        var _ = (require("../models/map"), require("underscore")),
            app = require("ampersand-app"),
            config = require("../config"),
            geo = require("../helpers/geo"),
            tinycolor = require("tinycolor2"),
            xhr = require("xhr");
        module.exports = {
            init: function() {
                app.on(app.actions.LINE_IMPORT, this.importLine, this), app.on(app.actions.LINE_IMPORT_ALL, this.importAllLines, this), app.on(app.actions.MAP_SELECT_COMPLETED, this.loadNearbyAgencies, this)
            },
            loadNearbyAgencies: function() {
                function afterRequest(err, resp, agencies) {
                    var maps = [];
                    agencies && agencies.length > 0 && (maps = agencies.map(this._parseAgency, this)), app.nearbyAgencies.reset(maps)
                }
                var center = app.selectedMap.center,
                    request = {
                        url: "https://flightcase.herokuapp.com/api/agencies?lng=" + center[1] + "&lat=" + center[0] + "&radius=5000",
                        json: !0
                    };
                xhr(request, _.bind(afterRequest, this))
            },
            importLine: function(options) {
                function afterRequest(err, resp, line) {
                    this._createLine(line, afterCreate)
                }

                function afterCreate(line) {
                    app.trigger(app.actions.LINE_IMPORT_COMPLETED, {
                        lineId: line.id
                    })
                }
                var request = {
                        url: "https://flightcase.herokuapp.com/api/lines/" + options.lineId,
                        json: !0
                    },
                    agency = app.nearbyAgencies.get(options.agencyId);
                agency.lines.get(options.lineId).importState = "importing", xhr(request, _.bind(afterRequest, this))
            },
            importAllLines: function(options) {
                function afterRequest(err, resp, lines) {
                    lines.forEach(function(line, index) {
                        _.delay(_.bind(this._createLine, this), 100 * index, line, afterCreate)
                    }, this)
                }

                function afterCreate() {
                    return lineCount - 1 > successCount ? void successCount++ : void app.trigger(app.actions.LINE_IMPORT_ALL_COMPLETED)
                }
                var request = {
                        url: "https://flightcase.herokuapp.com/api/agencies/" + options.agencyId + "/lines",
                        json: !0
                    },
                    agency = app.nearbyAgencies.get(options.agencyId);
                agency.lines.forEach(function(line) {
                    line.importState = "importing"
                });
                var lineCount = agency.lines.length,
                    successCount = 0;
                xhr(request, _.bind(afterRequest, this))
            },
            _createLine: function(attrs, callback) {
                attrs = this._parseLine(attrs);
                var agency = app.nearbyAgencies.get(attrs.mapId);
                if (agency.lines.get(attrs.id).importState = "imported", delete attrs.id, attrs.mapId = app.selectedMap.id, app.user && app.user.id === app.selectedMap.authorId) app.selectedMap.lines.create(attrs, {
                    parse: !1,
                    success: callback
                });
                else {
                    var line = app.selectedMap.lines.add(attrs);
                    line.id = line.cid, callback(line)
                }
            },
            _parseAgency: function(agency) {
                var attrs = {
                    id: agency.id,
                    name: agency.name,
                    distanceFromCentroid: agency.distance_from_centroid
                };
                return attrs.lines = agency.lines.map(this._parseLine, this), attrs
            },
            _parseLine: function(line) {
                function parse(geoJSON) {
                    var parsed = geo.parseGeoJSON(geoJSON),
                        firstStop = parsed.coordinates[0][0];
                    return parsed.coordinates.unshift([firstStop, firstStop]), parsed
                }
                var color = _.sample(config.defaults.colors);
                line.color && (color = this._beautifyColor(line.color));
                var attrs = {
                    id: line.id,
                    mapId: line.agency_id,
                    color: color,
                    name: [line.short_name, line.long_name].join(" ").trim(),
                    windows: line.windows
                };
                return line.inbound && (attrs.inbound = parse(line.inbound)), line.outbound && (attrs.outbound = parse(line.outbound)), attrs
            },
            _beautifyColor: function(color) {
                var defaults = config.defaults.colors;
                if (tinycolor.equals(color, "blue")) return defaults.blue;
                if (tinycolor.equals(color, "yellow")) return defaults.gold;
                if (tinycolor.equals(color, "green")) return defaults.green;
                if (tinycolor.equals(color, "magenta")) return defaults.magenta;
                if (tinycolor.equals(color, "orange")) return defaults.orange;
                if (tinycolor.equals(color, "purple")) return defaults.purple;
                if (tinycolor.equals(color, "red")) return defaults.red;
                if (tinycolor.equals(color, "turquoise")) return defaults.turquoise;
                var original = tinycolor(color),
                    brightness = tinycolor(color).darken(20).getBrightness();
                return brightness > 180 ? original.darken(50).toString() : brightness > 80 ? original.darken(10).toString() : original.toString()
            }
        }
    }, {
        "../config": 7,
        "../helpers/geo": 9,
        "../models/map": 18,
        "ampersand-app": 60,
        tinycolor2: 186,
        underscore: 189,
        xhr: 190
    }],
    4: [function(require, module) {
        var Layer = require("../models/layer"),
            app = require("ampersand-app"),
            xhr = require("xhr");
        module.exports = {
            init: function() {
                this.resetLayers(), app.on(app.actions.MAP_SELECT_COMPLETED, this.addMapLayers, this)
            },
            resetLayers: function() {
                var blank = new Layer({
                        name: "Blank Map",
                        description: "Great for sketching. Our favorite.",
                        field: "",
                        colors: ["#75737C"],
                        tiles: "https://{s}.tiles.mapbox.com/v3/transitmix.kel2bi8m/{z}/{x}/{y}{r}.png",
                        geoJSON: {
                            type: "FeatureCollection",
                            features: []
                        }
                    }),
                    satellite = new Layer({
                        name: "Satellite",
                        description: "As seen from space.",
                        field: "",
                        colors: ["#474A62"],
                        tiles: "https://{s}.tiles.mapbox.com/v3/transitmix.la6ielpe/{z}/{x}/{y}{r}.png",
                        geoJSON: {
                            type: "FeatureCollection",
                            features: []
                        }
                    });
                app.layers.reset([blank, satellite]), app.state.selectedLayer = blank, app.state.isLoadingLayers = !1
            },
            addMapLayers: function() {
                this.resetLayers();
                var self = this,
                    request = {
                        url: this.getCensusUrl(app.selectedMap),
                        json: !0
                    };
                app.state.isLoadingLayers = !0, xhr(request, function(err, resp, body) {
                    err && console.error("Loading layers from Turntable failed.");
                    var layers = self.parseLayers(body);
                    app.layers.add(layers), app.state.isLoadingLayers = !1
                })
            },
            getCensusUrl: function(map) {
                var url = "https://turntable-transitmix-herokuapp-com.global.ssl.fastly.net/layer?";
                return url = url + "latitude=" + map.center[0] + "&longitude=" + map.center[1], url += "&fields=b01003001.density,c17002001.c17002002.c17002003.percent", url += "&radius=0.12"
            },
            parseLayers: function(geoJSON) {
                if (!geoJSON || 0 === geoJSON.features.length) return [];
                var population = new Layer({
                        name: "US Population Density",
                        description: "Number of people living per square mile. Based on 2013 ACS data.",
                        field: "b01003001.density",
                        colors: ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"],
                        style: "absolute",
                        geoJSON: geoJSON,
                        tiles: "https://{s}.tiles.mapbox.com/v3/transitmix.kel2bi8m/{z}/{x}/{y}{r}.png",
                        units: "people"
                    }),
                    poverty = new Layer({
                        name: "US Poverty Rate",
                        description: "Percentage of households falling below the nation-wide poverty level. Based on 2013 ACS data.",
                        field: "c17002001.c17002002.c17002003.percent",
                        colors: ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#756bb1", "#54278f"],
                        style: "percentage",
                        geoJSON: geoJSON,
                        tiles: "https://{s}.tiles.mapbox.com/v3/transitmix.kel2bi8m/{z}/{x}/{y}{r}.png",
                        units: "households"
                    });
                return [population, poverty]
            }
        }
    }, {
        "../models/layer": 14,
        "ampersand-app": 60,
        xhr: 190
    }],
    5: [function(require, module) {
        var app = require("ampersand-app"),
            router = require("../router");
        module.exports = {
            init: function() {
                app.on(app.actions.MAP_SELECT, this.selectMap, this), app.on(app.actions.MAP_DESELECT, this.deselectMap, this), app.on(app.actions.LINE_SELECT, this.selectLine, this), app.on(app.actions.LINE_DESELECT, this.deselectLine, this), app.on(app.actions.MAP_LOAD_COMPLETED, this.selectMap, this), app.on(app.actions.MAP_CREATE_COMPLETED, this.selectMap, this), app.on(app.actions.MAP_DUPLICATE_COMPLETED, this.selectMap, this), app.on(app.actions.LINE_CREATE_COMPLETED, this.selectLine, this), app.on(app.actions.LINE_DUPLICATE_COMPLETED, this.selectLine, this), app.on(app.actions.LINE_DESTROY_COMPLETED, this.deselectLine, this), app.on(app.actions.LINE_IMPORT_COMPLETED, this.selectLine, this)
            },
            selectMap: function(options) {
                app.selectedMap = app.maps.get(options.mapId), app.trigger(app.actions.MAP_SELECT_COMPLETED), options.lineId ? this.selectLine(options) : this.deselectLine()
            },
            deselectMap: function() {
                app.selectedMap = !1, app.selectedLine = !1, app.trigger(app.actions.MAP_DESELECT_COMPLETED)
            },
            selectLine: function(options) {
                var line = app.selectedLine = app.selectedMap.lines.get(options.lineId);
                line ? (router.navigate("/map/" + app.selectedMap.id + "/line/" + line.id), line.statsLoaded || line.refreshStats()) : router.navigate("/map/" + app.selectedMap.id, {
                    replace: !0
                }), app.trigger(app.actions.LINE_SELECT_COMPLETED)
            },
            deselectLine: function() {
                app.selectedLine = void 0, router.navigate("/map/" + app.selectedMap.id), app.trigger(app.actions.LINE_DESELECT_COMPLETED)
            }
        }
    }, {
        "../router": 23,
        "ampersand-app": 60
    }],
    6: [function(require) {
        var BodyView = require("./views/body.js"),
            Layers = require("./models/layers"),
            Maps = require("./models/maps"),
            Model = require("ampersand-model"),
            User = require("./models/user"),
            actions = require("./actions/constants"),
            app = require("ampersand-app"),
            dataHandler = require("./actions/data"),
            domready = require("domready"),
            importHandler = require("./actions/import"),
            layerHandler = require("./actions/layer"),
            router = require("./router"),
            selectionHandler = require("./actions/selection"),
            csrf = document.querySelector('[name="csrf-token"]').getAttribute("content");
        window.blastoff = function(data) {
            var AppState = Model.extend({
                props: {
                    selectedLayer: {
                        type: "object"
                    },
                    isLoadingLayers: {
                        type: "boolean",
                        "default": !1
                    },
                    isExpanded: {
                        type: "boolean",
                        "default": !1
                    }
                }
            });
            if (app.extend({
                    actions: actions,
                    csrf: csrf,
                    layers: new Layers,
                    maps: new Maps(data && data.maps || [], {
                        parse: !0
                    }),
                    nearbyAgencies: new Maps({}, {
                        comparator: "distanceFromCentroid"
                    }),
                    selectedLine: void 0,
                    selectedMap: void 0,
                    state: new AppState
                }), data) {
                var user = new User({
                    id: data.id,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    org: data.org.name
                });
                app.extend({
                    user: user
                })
            }
            domready(function() {
                new BodyView({
                    el: document.body
                }).render(), dataHandler.init(), importHandler.init(), layerHandler.init(), selectionHandler.init(), router.init()
            })
        }
    }, {
        "./actions/constants": 1,
        "./actions/data": 2,
        "./actions/import": 3,
        "./actions/layer": 4,
        "./actions/selection": 5,
        "./models/layers": 15,
        "./models/maps": 19,
        "./models/user": 20,
        "./router": 23,
        "./views/body.js": 24,
        "ampersand-app": 60,
        "ampersand-model": 117,
        domready: 175
    }],
    7: [function(require, module) {
        module.exports = {
            map: {
                initialCenter: [35, 0],
                initialZoom: 3
            },
            defaults: {
                colors: {
                    blue: "#0071CA",
                    green: "#0D7215",
                    turquoise: "#049684",
                    gold: "#CC9B00",
                    orange: "#CE5504",
                    red: "#AD0101",
                    magenta: "#B10086",
                    purple: "#4E0963"
                },
                lineNames: ["Haberdasher", "Puddle Jumper", "Calypso", "Inverter", "Heart of Gold", "Yamato", "Starfighter", "Belafonte", "Cousteau", "X Wing", "Y Wing", "TIE Fighter", "Google Bus"],
                windows: [{
                    start: 360,
                    end: 540,
                    headway: 10,
                    speed: 16.1,
                    type: "weekday"
                }, {
                    start: 540,
                    end: 900,
                    headway: 15,
                    speed: 16.1,
                    type: "weekday"
                }, {
                    start: 900,
                    end: 1080,
                    headway: 10,
                    speed: 16.1,
                    type: "weekday"
                }, {
                    start: 1080,
                    end: 1200,
                    headway: 15,
                    speed: 16.1,
                    type: "weekday"
                }, {
                    start: 1200,
                    end: 1380,
                    headway: 30,
                    speed: 16.1,
                    type: "weekday"
                }, {
                    start: 360,
                    end: 1260,
                    headway: 15,
                    speed: 16.1,
                    type: "saturday"
                }, {
                    start: 1260,
                    end: 1380,
                    headway: 30,
                    speed: 16.1,
                    type: "saturday"
                }, {
                    start: 360,
                    end: 1260,
                    headway: 15,
                    speed: 16.1,
                    type: "sunday"
                }, {
                    start: 1260,
                    end: 1380,
                    headway: 30,
                    speed: 16.1,
                    type: "sunday"
                }]
            }
        }
    }, {}],
    8: [function(require, module, exports) {
        exports.trackPage = function(page) {
            "undefined" != typeof ga && ga("send", "pageview", {
                page: page
            })
        }
    }, {}],
    9: [function(require, module, exports) {
        var _ = require("underscore"),
            leaflet = require("../libraries/leaflet"),
            polylineEncoder = require("polyline-encoded"),
            xhr = require("xhr");
        exports.route = function(options, callback, context) {
            var latlngs = [options.from, options.to];
            if (options.via && latlngs.splice(1, 0, options.via), options.ignoreRoads) return void callback.call(context || this, latlngs);
            var request = {
                url: getRoutingUrl(latlngs),
                json: !0
            };
            xhr(request, function(err, resp, body) {
                if (err) return void console.log("Mapzen routing failed.");
                var geometry = body.route_geometry,
                    coordinates = polylineEncoder.decode(geometry, 6);
                coordinates = roundPolyline(coordinates), callback.call(context || this, coordinates)
            })
        };
        var getRoutingUrl = function(latlngs) {
                var encodedPoints = latlngs.map(function(latlng) {
                    return "loc=" + latlng[0] + "%2C" + latlng[1]
                }).join("&");
                return "https://osrm.mapzen.com/psv/viaroute?" + encodedPoints
            },
            roundPolyline = function(latlngs) {
                return latlngs.map(function(latlng) {
                    return latlng.map(function(point) {
                        return Math.round(1e5 * point) / 1e5
                    })
                })
            };
        exports.distance = function(latlngs) {
            for (var wrap = function(latlng) {
                    return {
                        lat: latlng[0],
                        lng: latlng[1]
                    }
                }, total = 0, i = 0; i < latlngs.length - 1; i++) total += leaflet.CRS.Earth.distance(wrap(latlngs[i]), wrap(latlngs[i + 1]));
            return total
        }, exports.closest = function(target, latlngs) {
            for (var index, distance = 1 / 0, i = 0; i < latlngs.length; i++) {
                var d = exports.distance([target, latlngs[i]]);
                distance > d && (distance = d, index = i)
            }
            return index
        }, exports.geocode = function(city, callback, context) {
            var address = encodeURIComponent(city),
                url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + address,
                request = {
                    url: url,
                    json: !0
                };
            xhr(request, function(err, resp, body) {
                (body.error || 0 === body.results.length) && console.log("Unable to geocode city. Womp Womp.", body.error);
                for (var location = body.results[0].geometry.location, latlng = [location.lat, location.lng], useMetricUnits = !0, components = body.results[0].address_components, i = 0; i < components.length; i++) {
                    var component = components[i],
                        name = component.long_name;
                    _.contains(component.types, "locality") && (city = name), ("United States" === name || "United Kingdom" === name) && (useMetricUnits = !1)
                }
                callback.call(context || this, {
                    city: city,
                    latlng: latlng,
                    useMetricUnits: useMetricUnits
                })
            })
        };
        var flipLatLng = exports.flipLatLng = function(latlngs) {
            return _.isNumber(latlngs[0]) ? [latlngs[1], latlngs[0]] : latlngs.map(flipLatLng)
        };
        exports.parseGeoJSON = function(geoJSON) {
            var attrs = JSON.parse(geoJSON);
            return {
                type: attrs.type,
                coordinates: flipLatLng(attrs.coordinates)
            }
        }, exports.encodeGeoJSON = function(attrs) {
            return JSON.stringify({
                type: attrs.type,
                coordinates: flipLatLng(attrs.coordinates)
            })
        }
    }, {
        "../libraries/leaflet": 11,
        "polyline-encoded": 185,
        underscore: 189,
        xhr: 190
    }],
    10: [function(require) {
        var leaflet = require("../libraries/leaflet");
        if ("0.8-dev" !== leaflet.version) throw new Error("Attempting to patch Leaflet " + leaflet.version + ". Only 0.8-dev (1ec89d2) is supported");
        leaflet.Draggable.prototype._onDown = function(e) {
            if (this._moved = !1, (1 === e.which || 1 === e.button || e.touches) && (L.DomEvent.stopPropagation(e), !L.DomUtil.hasClass(this._element, "leaflet-zoom-anim") && (L.DomUtil.disableImageDrag(), L.DomUtil.disableTextSelection(), !this._moving))) {
                this.fire("down");
                var first = e.touches ? e.touches[0] : e;
                this._startPoint = new L.Point(first.clientX, first.clientY), this._startPos = this._newPos = L.DomUtil.getPosition(this._element), L.DomEvent.on(document, L.Draggable.MOVE[e.type], this._onMove, this).on(document, L.Draggable.END[e.type], this._onUp, this)
            }
        }
    }, {
        "../libraries/leaflet": 11
    }],
    11: [function(require, module) {
        ! function(window, document, undefined) {
            function expose() {
                var oldL = window.L;
                L.noConflict = function() {
                    return window.L = oldL, this
                }, window.L = L
            }
            var L = {
                version: "0.8-dev"
            };
            "object" == typeof module && "object" == typeof module.exports ? module.exports = L : "function" == typeof define && define.amd && define(L), "undefined" != typeof window && expose(), L.Util = {
                    extend: function(dest) {
                        var i, j, len, src;
                        for (j = 1, len = arguments.length; len > j; j++) {
                            src = arguments[j];
                            for (i in src) dest[i] = src[i]
                        }
                        return dest
                    },
                    create: Object.create || function() {
                        function F() {}
                        return function(proto) {
                            return F.prototype = proto, new F
                        }
                    }(),
                    bind: function(fn, obj) {
                        var slice = Array.prototype.slice;
                        if (fn.bind) return fn.bind.apply(fn, slice.call(arguments, 1));
                        var args = slice.call(arguments, 2);
                        return function() {
                            return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments)
                        }
                    },
                    stamp: function(obj) {
                        return obj._leaflet_id = obj._leaflet_id || ++L.Util.lastId, obj._leaflet_id
                    },
                    lastId: 0,
                    throttle: function(fn, time, context) {
                        var lock, args, wrapperFn, later;
                        return later = function() {
                            lock = !1, args && (wrapperFn.apply(context, args), args = !1)
                        }, wrapperFn = function() {
                            lock ? args = arguments : (fn.apply(context, arguments), setTimeout(later, time), lock = !0)
                        }
                    },
                    wrapNum: function(x, range, includeMax) {
                        var max = range[1],
                            min = range[0],
                            d = max - min;
                        return x === max && includeMax ? x : ((x - min) % d + d) % d + min
                    },
                    falseFn: function() {
                        return !1
                    },
                    formatNum: function(num, digits) {
                        var pow = Math.pow(10, digits || 5);
                        return Math.round(num * pow) / pow
                    },
                    trim: function(str) {
                        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, "")
                    },
                    splitWords: function(str) {
                        return L.Util.trim(str).split(/\s+/)
                    },
                    setOptions: function(obj, options) {
                        obj.hasOwnProperty("options") || (obj.options = obj.options ? L.Util.create(obj.options) : {});
                        for (var i in options) obj.options[i] = options[i];
                        return obj.options
                    },
                    getParamString: function(obj, existingUrl, uppercase) {
                        var params = [];
                        for (var i in obj) params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + "=" + encodeURIComponent(obj[i]));
                        return (existingUrl && -1 !== existingUrl.indexOf("?") ? "&" : "?") + params.join("&")
                    },
                    template: function(str, data) {
                        return str.replace(L.Util.templateRe, function(str, key) {
                            var value = data[key];
                            if (value === undefined) throw new Error("No value provided for variable " + str);
                            return "function" == typeof value && (value = value(data)), value
                        })
                    },
                    templateRe: /\{ *([\w_]+) *\}/g,
                    isArray: Array.isArray || function(obj) {
                        return "[object Array]" === Object.prototype.toString.call(obj)
                    },
                    emptyImageUrl: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                },
                function() {
                    function getPrefixed(name) {
                        return window["webkit" + name] || window["moz" + name] || window["ms" + name]
                    }

                    function timeoutDefer(fn) {
                        var time = +new Date,
                            timeToCall = Math.max(0, 16 - (time - lastTime));
                        return lastTime = time + timeToCall, window.setTimeout(fn, timeToCall)
                    }
                    var lastTime = 0,
                        requestFn = window.requestAnimationFrame || getPrefixed("RequestAnimationFrame") || timeoutDefer,
                        cancelFn = window.cancelAnimationFrame || getPrefixed("CancelAnimationFrame") || getPrefixed("CancelRequestAnimationFrame") || function(id) {
                            window.clearTimeout(id)
                        };
                    L.Util.requestAnimFrame = function(fn, context, immediate) {
                        return immediate && requestFn === timeoutDefer ? void fn.call(context) : requestFn.call(window, L.bind(fn, context))
                    }, L.Util.cancelAnimFrame = function(id) {
                        id && cancelFn.call(window, id)
                    }
                }(), L.extend = L.Util.extend, L.bind = L.Util.bind, L.stamp = L.Util.stamp, L.setOptions = L.Util.setOptions, L.Class = function() {}, L.Class.extend = function(props) {
                    var NewClass = function() {
                            this.initialize && this.initialize.apply(this, arguments), this.callInitHooks()
                        },
                        parentProto = NewClass.__super__ = this.prototype,
                        proto = L.Util.create(parentProto);
                    proto.constructor = NewClass, NewClass.prototype = proto;
                    for (var i in this) this.hasOwnProperty(i) && "prototype" !== i && (NewClass[i] = this[i]);
                    return props.statics && (L.extend(NewClass, props.statics), delete props.statics), props.includes && (L.Util.extend.apply(null, [proto].concat(props.includes)), delete props.includes), proto.options && (props.options = L.Util.extend(L.Util.create(proto.options), props.options)), L.extend(proto, props), proto._initHooks = [], proto.callInitHooks = function() {
                        if (!this._initHooksCalled) {
                            parentProto.callInitHooks && parentProto.callInitHooks.call(this), this._initHooksCalled = !0;
                            for (var i = 0, len = proto._initHooks.length; len > i; i++) proto._initHooks[i].call(this)
                        }
                    }, NewClass
                }, L.Class.include = function(props) {
                    L.extend(this.prototype, props)
                }, L.Class.mergeOptions = function(options) {
                    L.extend(this.prototype.options, options)
                }, L.Class.addInitHook = function(fn) {
                    var args = Array.prototype.slice.call(arguments, 1),
                        init = "function" == typeof fn ? fn : function() {
                            this[fn].apply(this, args)
                        };
                    this.prototype._initHooks = this.prototype._initHooks || [], this.prototype._initHooks.push(init)
                }, L.Evented = L.Class.extend({
                    on: function(types, fn, context) {
                        if ("object" == typeof types)
                            for (var type in types) this._on(type, types[type], fn);
                        else {
                            types = L.Util.splitWords(types);
                            for (var i = 0, len = types.length; len > i; i++) this._on(types[i], fn, context)
                        }
                        return this
                    },
                    off: function(types, fn, context) {
                        if (types)
                            if ("object" == typeof types)
                                for (var type in types) this._off(type, types[type], fn);
                            else {
                                types = L.Util.splitWords(types);
                                for (var i = 0, len = types.length; len > i; i++) this._off(types[i], fn, context)
                            } else delete this._events;
                        return this
                    },
                    _on: function(type, fn, context) {
                        var events = this._events = this._events || {},
                            contextId = context && context !== this && L.stamp(context);
                        if (contextId) {
                            var indexKey = type + "_idx",
                                indexLenKey = type + "_len",
                                typeIndex = events[indexKey] = events[indexKey] || {},
                                id = L.stamp(fn) + "_" + contextId;
                            typeIndex[id] || (typeIndex[id] = {
                                fn: fn,
                                ctx: context
                            }, events[indexLenKey] = (events[indexLenKey] || 0) + 1)
                        } else events[type] = events[type] || [], events[type].push({
                            fn: fn
                        })
                    },
                    _off: function(type, fn, context) {
                        var events = this._events,
                            indexKey = type + "_idx",
                            indexLenKey = type + "_len";
                        if (events) {
                            if (!fn) return delete events[type], delete events[indexKey], void delete events[indexLenKey];
                            var listeners, i, len, listener, id, contextId = context && context !== this && L.stamp(context);
                            if (contextId) id = L.stamp(fn) + "_" + contextId, listeners = events[indexKey], listeners && listeners[id] && (listener = listeners[id], delete listeners[id], events[indexLenKey]--);
                            else if (listeners = events[type])
                                for (i = 0, len = listeners.length; len > i; i++)
                                    if (listeners[i].fn === fn) {
                                        listener = listeners[i], listeners.splice(i, 1);
                                        break
                                    }
                            listener && (listener.fn = L.Util.falseFn)
                        }
                    },
                    fire: function(type, data, propagate) {
                        if (!this.listens(type, propagate)) return this;
                        var event = L.Util.extend({}, data, {
                                type: type,
                                target: this
                            }),
                            events = this._events;
                        if (events) {
                            var i, len, listeners, id, typeIndex = events[type + "_idx"];
                            if (events[type])
                                for (listeners = events[type].slice(), i = 0, len = listeners.length; len > i; i++) listeners[i].fn.call(this, event);
                            for (id in typeIndex) typeIndex[id].fn.call(typeIndex[id].ctx, event)
                        }
                        return propagate && this._propagateEvent(event), this
                    },
                    listens: function(type, propagate) {
                        var events = this._events;
                        if (events && (events[type] || events[type + "_len"])) return !0;
                        if (propagate)
                            for (var id in this._eventParents)
                                if (this._eventParents[id].listens(type, propagate)) return !0;
                        return !1
                    },
                    once: function(types, fn, context) {
                        if ("object" == typeof types) {
                            for (var type in types) this.once(type, types[type], fn);
                            return this
                        }
                        var handler = L.bind(function() {
                            this.off(types, fn, context).off(types, handler, context)
                        }, this);
                        return this.on(types, fn, context).on(types, handler, context)
                    },
                    addEventParent: function(obj) {
                        return this._eventParents = this._eventParents || {}, this._eventParents[L.stamp(obj)] = obj, this
                    },
                    removeEventParent: function(obj) {
                        return this._eventParents && delete this._eventParents[L.stamp(obj)], this
                    },
                    _propagateEvent: function(e) {
                        for (var id in this._eventParents) this._eventParents[id].fire(e.type, L.extend({
                            layer: e.target
                        }, e), !0)
                    }
                });
            var proto = L.Evented.prototype;
            proto.addEventListener = proto.on, proto.removeEventListener = proto.clearAllEventListeners = proto.off, proto.addOneTimeEventListener = proto.once, proto.fireEvent = proto.fire, proto.hasEventListeners = proto.listens, L.Mixin = {
                    Events: proto
                },
                function() {
                    var ua = navigator.userAgent.toLowerCase(),
                        doc = document.documentElement,
                        ie = "ActiveXObject" in window,
                        webkit = -1 !== ua.indexOf("webkit"),
                        phantomjs = -1 !== ua.indexOf("phantom"),
                        android23 = -1 !== ua.search("android [23]"),
                        chrome = -1 !== ua.indexOf("chrome"),
                        mobile = "undefined" != typeof orientation,
                        msPointer = navigator.msPointerEnabled && navigator.msMaxTouchPoints && !window.PointerEvent,
                        pointer = window.PointerEvent && navigator.pointerEnabled && navigator.maxTouchPoints || msPointer,
                        ie3d = ie && "transition" in doc.style,
                        webkit3d = "WebKitCSSMatrix" in window && "m11" in new window.WebKitCSSMatrix && !android23,
                        gecko3d = "MozPerspective" in doc.style,
                        opera3d = "OTransition" in doc.style,
                        touch = !window.L_NO_TOUCH && !phantomjs && (pointer || "ontouchstart" in window || window.DocumentTouch && document instanceof window.DocumentTouch);
                    L.Browser = {
                        ie: ie,
                        ielt9: ie && !document.addEventListener,
                        webkit: webkit,
                        gecko: -1 !== ua.indexOf("gecko") && !webkit && !window.opera && !ie,
                        android: -1 !== ua.indexOf("android"),
                        android23: android23,
                        chrome: chrome,
                        safari: !chrome && -1 !== ua.indexOf("safari"),
                        ie3d: ie3d,
                        webkit3d: webkit3d,
                        gecko3d: gecko3d,
                        opera3d: opera3d,
                        any3d: !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs,
                        mobile: mobile,
                        mobileWebkit: mobile && webkit,
                        mobileWebkit3d: mobile && webkit3d,
                        mobileOpera: mobile && window.opera,
                        touch: !!touch,
                        msPointer: !!msPointer,
                        pointer: !!pointer,
                        retina: (window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI) > 1
                    }
                }(), L.Point = function(x, y, round) {
                    this.x = round ? Math.round(x) : x, this.y = round ? Math.round(y) : y
                }, L.Point.prototype = {
                    clone: function() {
                        return new L.Point(this.x, this.y)
                    },
                    add: function(point) {
                        return this.clone()._add(L.point(point))
                    },
                    _add: function(point) {
                        return this.x += point.x, this.y += point.y, this
                    },
                    subtract: function(point) {
                        return this.clone()._subtract(L.point(point))
                    },
                    _subtract: function(point) {
                        return this.x -= point.x, this.y -= point.y, this
                    },
                    divideBy: function(num) {
                        return this.clone()._divideBy(num)
                    },
                    _divideBy: function(num) {
                        return this.x /= num, this.y /= num, this
                    },
                    multiplyBy: function(num) {
                        return this.clone()._multiplyBy(num)
                    },
                    _multiplyBy: function(num) {
                        return this.x *= num, this.y *= num, this
                    },
                    round: function() {
                        return this.clone()._round()
                    },
                    _round: function() {
                        return this.x = Math.round(this.x), this.y = Math.round(this.y), this
                    },
                    floor: function() {
                        return this.clone()._floor()
                    },
                    _floor: function() {
                        return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this
                    },
                    ceil: function() {
                        return this.clone()._ceil()
                    },
                    _ceil: function() {
                        return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this
                    },
                    distanceTo: function(point) {
                        point = L.point(point);
                        var x = point.x - this.x,
                            y = point.y - this.y;
                        return Math.sqrt(x * x + y * y)
                    },
                    equals: function(point) {
                        return point = L.point(point), point.x === this.x && point.y === this.y
                    },
                    contains: function(point) {
                        return point = L.point(point), Math.abs(point.x) <= Math.abs(this.x) && Math.abs(point.y) <= Math.abs(this.y)
                    },
                    toString: function() {
                        return "Point(" + L.Util.formatNum(this.x) + ", " + L.Util.formatNum(this.y) + ")"
                    }
                }, L.point = function(x, y, round) {
                    return x instanceof L.Point ? x : L.Util.isArray(x) ? new L.Point(x[0], x[1]) : x === undefined || null === x ? x : new L.Point(x, y, round)
                }, L.Bounds = function(a, b) {
                    if (a)
                        for (var points = b ? [a, b] : a, i = 0, len = points.length; len > i; i++) this.extend(points[i])
                }, L.Bounds.prototype = {
                    extend: function(point) {
                        return point = L.point(point), this.min || this.max ? (this.min.x = Math.min(point.x, this.min.x), this.max.x = Math.max(point.x, this.max.x), this.min.y = Math.min(point.y, this.min.y), this.max.y = Math.max(point.y, this.max.y)) : (this.min = point.clone(), this.max = point.clone()), this
                    },
                    getCenter: function(round) {
                        return new L.Point((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2, round)
                    },
                    getBottomLeft: function() {
                        return new L.Point(this.min.x, this.max.y)
                    },
                    getTopRight: function() {
                        return new L.Point(this.max.x, this.min.y)
                    },
                    getSize: function() {
                        return this.max.subtract(this.min)
                    },
                    contains: function(obj) {
                        var min, max;
                        return obj = "number" == typeof obj[0] || obj instanceof L.Point ? L.point(obj) : L.bounds(obj), obj instanceof L.Bounds ? (min = obj.min, max = obj.max) : min = max = obj, min.x >= this.min.x && max.x <= this.max.x && min.y >= this.min.y && max.y <= this.max.y
                    },
                    intersects: function(bounds) {
                        bounds = L.bounds(bounds);
                        var min = this.min,
                            max = this.max,
                            min2 = bounds.min,
                            max2 = bounds.max,
                            xIntersects = max2.x >= min.x && min2.x <= max.x,
                            yIntersects = max2.y >= min.y && min2.y <= max.y;
                        return xIntersects && yIntersects
                    },
                    isValid: function() {
                        return !(!this.min || !this.max)
                    }
                }, L.bounds = function(a, b) {
                    return !a || a instanceof L.Bounds ? a : new L.Bounds(a, b)
                }, L.Transformation = function(a, b, c, d) {
                    this._a = a, this._b = b, this._c = c, this._d = d
                }, L.Transformation.prototype = {
                    transform: function(point, scale) {
                        return this._transform(point.clone(), scale)
                    },
                    _transform: function(point, scale) {
                        return scale = scale || 1, point.x = scale * (this._a * point.x + this._b), point.y = scale * (this._c * point.y + this._d), point
                    },
                    untransform: function(point, scale) {
                        return scale = scale || 1, new L.Point((point.x / scale - this._b) / this._a, (point.y / scale - this._d) / this._c)
                    }
                }, L.DomUtil = {
                    get: function(id) {
                        return "string" == typeof id ? document.getElementById(id) : id
                    },
                    getStyle: function(el, style) {
                        var value = el.style[style] || el.currentStyle && el.currentStyle[style];
                        if ((!value || "auto" === value) && document.defaultView) {
                            var css = document.defaultView.getComputedStyle(el, null);
                            value = css ? css[style] : null
                        }
                        return "auto" === value ? null : value
                    },
                    create: function(tagName, className, container) {
                        var el = document.createElement(tagName);
                        return el.className = className, container && container.appendChild(el), el
                    },
                    remove: function(el) {
                        var parent = el.parentNode;
                        parent && parent.removeChild(el)
                    },
                    empty: function(el) {
                        for (; el.firstChild;) el.removeChild(el.firstChild)
                    },
                    toFront: function(el) {
                        el.parentNode.appendChild(el)
                    },
                    toBack: function(el) {
                        var parent = el.parentNode;
                        parent.insertBefore(el, parent.firstChild)
                    },
                    hasClass: function(el, name) {
                        if (el.classList !== undefined) return el.classList.contains(name);
                        var className = L.DomUtil.getClass(el);
                        return className.length > 0 && new RegExp("(^|\\s)" + name + "(\\s|$)").test(className)
                    },
                    addClass: function(el, name) {
                        if (el.classList !== undefined)
                            for (var classes = L.Util.splitWords(name), i = 0, len = classes.length; len > i; i++) el.classList.add(classes[i]);
                        else if (!L.DomUtil.hasClass(el, name)) {
                            var className = L.DomUtil.getClass(el);

                            L.DomUtil.setClass(el, (className ? className + " " : "") + name)
                        }
                    },
                    removeClass: function(el, name) {
                        el.classList !== undefined ? el.classList.remove(name) : L.DomUtil.setClass(el, L.Util.trim((" " + L.DomUtil.getClass(el) + " ").replace(" " + name + " ", " ")))
                    },
                    setClass: function(el, name) {
                        el.className.baseVal === undefined ? el.className = name : el.className.baseVal = name
                    },
                    getClass: function(el) {
                        return el.className.baseVal === undefined ? el.className : el.className.baseVal
                    },
                    setOpacity: function(el, value) {
                        if ("opacity" in el.style) el.style.opacity = value;
                        else if ("filter" in el.style) {
                            var filter = !1,
                                filterName = "DXImageTransform.Microsoft.Alpha";
                            try {
                                filter = el.filters.item(filterName)
                            } catch (e) {
                                if (1 === value) return
                            }
                            value = Math.round(100 * value), filter ? (filter.Enabled = 100 !== value, filter.Opacity = value) : el.style.filter += " progid:" + filterName + "(opacity=" + value + ")"
                        }
                    },
                    testProp: function(props) {
                        for (var style = document.documentElement.style, i = 0; i < props.length; i++)
                            if (props[i] in style) return props[i];
                        return !1
                    },
                    setTransform: function(el, offset, scale) {
                        var pos = offset || new L.Point(0, 0);
                        el.style[L.DomUtil.TRANSFORM] = "translate3d(" + pos.x + "px," + pos.y + "px,0)" + (scale ? " scale(" + scale + ")" : "")
                    },
                    setPosition: function(el, point, no3d) {
                        el._leaflet_pos = point, L.Browser.any3d && !no3d ? L.DomUtil.setTransform(el, point) : (el.style.left = point.x + "px", el.style.top = point.y + "px")
                    },
                    getPosition: function(el) {
                        return el._leaflet_pos
                    }
                },
                function() {
                    L.DomUtil.TRANSFORM = L.DomUtil.testProp(["transform", "WebkitTransform", "OTransform", "MozTransform", "msTransform"]);
                    var transition = L.DomUtil.TRANSITION = L.DomUtil.testProp(["webkitTransition", "transition", "OTransition", "MozTransition", "msTransition"]);
                    if (L.DomUtil.TRANSITION_END = "webkitTransition" === transition || "OTransition" === transition ? transition + "End" : "transitionend", "onselectstart" in document) L.DomUtil.disableTextSelection = function() {
                        L.DomEvent.on(window, "selectstart", L.DomEvent.preventDefault)
                    }, L.DomUtil.enableTextSelection = function() {
                        L.DomEvent.off(window, "selectstart", L.DomEvent.preventDefault)
                    };
                    else {
                        var userSelectProperty = L.DomUtil.testProp(["userSelect", "WebkitUserSelect", "OUserSelect", "MozUserSelect", "msUserSelect"]);
                        L.DomUtil.disableTextSelection = function() {
                            if (userSelectProperty) {
                                var style = document.documentElement.style;
                                this._userSelect = style[userSelectProperty], style[userSelectProperty] = "none"
                            }
                        }, L.DomUtil.enableTextSelection = function() {
                            userSelectProperty && (document.documentElement.style[userSelectProperty] = this._userSelect, delete this._userSelect)
                        }
                    }
                    L.DomUtil.disableImageDrag = function() {
                        L.DomEvent.on(window, "dragstart", L.DomEvent.preventDefault)
                    }, L.DomUtil.enableImageDrag = function() {
                        L.DomEvent.off(window, "dragstart", L.DomEvent.preventDefault)
                    }
                }(), L.LatLng = function(lat, lng, alt) {
                    if (isNaN(lat) || isNaN(lng)) throw new Error("Invalid LatLng object: (" + lat + ", " + lng + ")");
                    this.lat = +lat, this.lng = +lng, alt !== undefined && (this.alt = +alt)
                }, L.LatLng.prototype = {
                    equals: function(obj, maxMargin) {
                        if (!obj) return !1;
                        obj = L.latLng(obj);
                        var margin = Math.max(Math.abs(this.lat - obj.lat), Math.abs(this.lng - obj.lng));
                        return (maxMargin === undefined ? 1e-9 : maxMargin) >= margin
                    },
                    toString: function(precision) {
                        return "LatLng(" + L.Util.formatNum(this.lat, precision) + ", " + L.Util.formatNum(this.lng, precision) + ")"
                    },
                    distanceTo: function(other) {
                        return L.CRS.Earth.distance(this, L.latLng(other))
                    },
                    wrap: function() {
                        return L.CRS.Earth.wrapLatLng(this)
                    },
                    toBounds: function(sizeInMeters) {
                        var latAccuracy = 180 * sizeInMeters / 40075017,
                            lngAccuracy = latAccuracy / Math.cos(Math.PI / 180 * this.lat);
                        return L.latLngBounds([this.lat - latAccuracy, this.lng - lngAccuracy], [this.lat + latAccuracy, this.lng + lngAccuracy])
                    }
                }, L.latLng = function(a, b) {
                    return a instanceof L.LatLng ? a : L.Util.isArray(a) && "object" != typeof a[0] ? 3 === a.length ? new L.LatLng(a[0], a[1], a[2]) : new L.LatLng(a[0], a[1]) : a === undefined || null === a ? a : "object" == typeof a && "lat" in a ? new L.LatLng(a.lat, "lng" in a ? a.lng : a.lon) : b === undefined ? null : new L.LatLng(a, b)
                }, L.LatLngBounds = function(southWest, northEast) {
                    if (southWest)
                        for (var latlngs = northEast ? [southWest, northEast] : southWest, i = 0, len = latlngs.length; len > i; i++) this.extend(latlngs[i])
                }, L.LatLngBounds.prototype = {
                    extend: function(obj) {
                        var sw2, ne2, sw = this._southWest,
                            ne = this._northEast;
                        if (obj instanceof L.LatLng) sw2 = obj, ne2 = obj;
                        else {
                            if (!(obj instanceof L.LatLngBounds)) return obj ? this.extend(L.latLng(obj) || L.latLngBounds(obj)) : this;
                            if (sw2 = obj._southWest, ne2 = obj._northEast, !sw2 || !ne2) return this
                        }
                        return sw || ne ? (sw.lat = Math.min(sw2.lat, sw.lat), sw.lng = Math.min(sw2.lng, sw.lng), ne.lat = Math.max(ne2.lat, ne.lat), ne.lng = Math.max(ne2.lng, ne.lng)) : (this._southWest = new L.LatLng(sw2.lat, sw2.lng), this._northEast = new L.LatLng(ne2.lat, ne2.lng)), this
                    },
                    pad: function(bufferRatio) {
                        var sw = this._southWest,
                            ne = this._northEast,
                            heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,
                            widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;
                        return new L.LatLngBounds(new L.LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer), new L.LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer))
                    },
                    getCenter: function() {
                        return new L.LatLng((this._southWest.lat + this._northEast.lat) / 2, (this._southWest.lng + this._northEast.lng) / 2)
                    },
                    getSouthWest: function() {
                        return this._southWest
                    },
                    getNorthEast: function() {
                        return this._northEast
                    },
                    getNorthWest: function() {
                        return new L.LatLng(this.getNorth(), this.getWest())
                    },
                    getSouthEast: function() {
                        return new L.LatLng(this.getSouth(), this.getEast())
                    },
                    getWest: function() {
                        return this._southWest.lng
                    },
                    getSouth: function() {
                        return this._southWest.lat
                    },
                    getEast: function() {
                        return this._northEast.lng
                    },
                    getNorth: function() {
                        return this._northEast.lat
                    },
                    contains: function(obj) {
                        obj = "number" == typeof obj[0] || obj instanceof L.LatLng ? L.latLng(obj) : L.latLngBounds(obj);
                        var sw2, ne2, sw = this._southWest,
                            ne = this._northEast;
                        return obj instanceof L.LatLngBounds ? (sw2 = obj.getSouthWest(), ne2 = obj.getNorthEast()) : sw2 = ne2 = obj, sw2.lat >= sw.lat && ne2.lat <= ne.lat && sw2.lng >= sw.lng && ne2.lng <= ne.lng
                    },
                    intersects: function(bounds) {
                        bounds = L.latLngBounds(bounds);
                        var sw = this._southWest,
                            ne = this._northEast,
                            sw2 = bounds.getSouthWest(),
                            ne2 = bounds.getNorthEast(),
                            latIntersects = ne2.lat >= sw.lat && sw2.lat <= ne.lat,
                            lngIntersects = ne2.lng >= sw.lng && sw2.lng <= ne.lng;
                        return latIntersects && lngIntersects
                    },
                    toBBoxString: function() {
                        return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(",")
                    },
                    equals: function(bounds) {
                        return bounds ? (bounds = L.latLngBounds(bounds), this._southWest.equals(bounds.getSouthWest()) && this._northEast.equals(bounds.getNorthEast())) : !1
                    },
                    isValid: function() {
                        return !(!this._southWest || !this._northEast)
                    }
                }, L.latLngBounds = function(a, b) {
                    return !a || a instanceof L.LatLngBounds ? a : new L.LatLngBounds(a, b)
                }, L.Projection = {}, L.Projection.LonLat = {
                    project: function(latlng) {
                        return new L.Point(latlng.lng, latlng.lat)
                    },
                    unproject: function(point) {
                        return new L.LatLng(point.y, point.x)
                    },
                    bounds: L.bounds([-180, -90], [180, 90])
                }, L.Projection.SphericalMercator = {
                    R: 6378137,
                    project: function(latlng) {
                        var d = Math.PI / 180,
                            max = 1 - 1e-15,
                            sin = Math.max(Math.min(Math.sin(latlng.lat * d), max), -max);
                        return new L.Point(this.R * latlng.lng * d, this.R * Math.log((1 + sin) / (1 - sin)) / 2)
                    },
                    unproject: function(point) {
                        var d = 180 / Math.PI;
                        return new L.LatLng((2 * Math.atan(Math.exp(point.y / this.R)) - Math.PI / 2) * d, point.x * d / this.R)
                    },
                    bounds: function() {
                        var d = 6378137 * Math.PI;
                        return L.bounds([-d, -d], [d, d])
                    }()
                }, L.CRS = {
                    latLngToPoint: function(latlng, zoom) {
                        var projectedPoint = this.projection.project(latlng),
                            scale = this.scale(zoom);
                        return this.transformation._transform(projectedPoint, scale)
                    },
                    pointToLatLng: function(point, zoom) {
                        var scale = this.scale(zoom),
                            untransformedPoint = this.transformation.untransform(point, scale);
                        return this.projection.unproject(untransformedPoint)
                    },
                    project: function(latlng) {
                        return this.projection.project(latlng)
                    },
                    unproject: function(point) {
                        return this.projection.unproject(point)
                    },
                    scale: function(zoom) {
                        return 256 * Math.pow(2, zoom)
                    },
                    getProjectedBounds: function(zoom) {
                        if (this.infinite) return null;
                        var b = this.projection.bounds,
                            s = this.scale(zoom),
                            min = this.transformation.transform(b.min, s),
                            max = this.transformation.transform(b.max, s);
                        return L.bounds(min, max)
                    },
                    wrapLatLng: function(latlng) {
                        var lng = this.wrapLng ? L.Util.wrapNum(latlng.lng, this.wrapLng, !0) : latlng.lng,
                            lat = this.wrapLat ? L.Util.wrapNum(latlng.lat, this.wrapLat, !0) : latlng.lat;
                        return L.latLng(lat, lng)
                    }
                }, L.CRS.Simple = L.extend({}, L.CRS, {
                    projection: L.Projection.LonLat,
                    transformation: new L.Transformation(1, 0, -1, 0),
                    scale: function(zoom) {
                        return Math.pow(2, zoom)
                    },
                    distance: function(latlng1, latlng2) {
                        var dx = latlng2.lng - latlng1.lng,
                            dy = latlng2.lat - latlng1.lat;
                        return Math.sqrt(dx * dx + dy * dy)
                    },
                    infinite: !0
                }), L.CRS.Earth = L.extend({}, L.CRS, {
                    wrapLng: [-180, 180],
                    R: 6378137,
                    distance: function(latlng1, latlng2) {
                        var rad = Math.PI / 180,
                            lat1 = latlng1.lat * rad,
                            lat2 = latlng2.lat * rad,
                            a = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos((latlng2.lng - latlng1.lng) * rad);
                        return this.R * Math.acos(Math.min(a, 1))
                    }
                }), L.CRS.EPSG3857 = L.extend({}, L.CRS.Earth, {
                    code: "EPSG:3857",
                    projection: L.Projection.SphericalMercator,
                    transformation: function() {
                        var scale = .5 / (Math.PI * L.Projection.SphericalMercator.R);
                        return new L.Transformation(scale, .5, -scale, .5)
                    }()
                }), L.CRS.EPSG900913 = L.extend({}, L.CRS.EPSG3857, {
                    code: "EPSG:900913"
                }), L.CRS.EPSG4326 = L.extend({}, L.CRS.Earth, {
                    code: "EPSG:4326",
                    projection: L.Projection.LonLat,
                    transformation: new L.Transformation(1 / 180, 1, -1 / 180, .5)
                }), L.Map = L.Evented.extend({
                    options: {
                        crs: L.CRS.EPSG3857,
                        fadeAnimation: !0,
                        trackResize: !0,
                        markerZoomAnimation: !0
                    },
                    initialize: function(id, options) {
                        options = L.setOptions(this, options), this._initContainer(id), this._initLayout(), this._onResize = L.bind(this._onResize, this), this._initEvents(), options.maxBounds && this.setMaxBounds(options.maxBounds), options.zoom !== undefined && (this._zoom = this._limitZoom(options.zoom)), options.center && options.zoom !== undefined && this.setView(L.latLng(options.center), options.zoom, {
                            reset: !0
                        }), this._handlers = [], this._layers = {}, this._zoomBoundLayers = {}, this._sizeChanged = !0, this.callInitHooks(), this._addLayers(this.options.layers)
                    },
                    setView: function(center, zoom) {
                        return zoom = zoom === undefined ? this.getZoom() : zoom, this._resetView(L.latLng(center), this._limitZoom(zoom)), this
                    },
                    setZoom: function(zoom, options) {
                        return this._loaded ? this.setView(this.getCenter(), zoom, {
                            zoom: options
                        }) : (this._zoom = this._limitZoom(zoom), this)
                    },
                    zoomIn: function(delta, options) {
                        return this.setZoom(this._zoom + (delta || 1), options)
                    },
                    zoomOut: function(delta, options) {
                        return this.setZoom(this._zoom - (delta || 1), options)
                    },
                    setZoomAround: function(latlng, zoom, options) {
                        var scale = this.getZoomScale(zoom),
                            viewHalf = this.getSize().divideBy(2),
                            containerPoint = latlng instanceof L.Point ? latlng : this.latLngToContainerPoint(latlng),
                            centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
                            newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));
                        return this.setView(newCenter, zoom, {
                            zoom: options
                        })
                    },
                    fitBounds: function(bounds, options) {
                        options = options || {}, bounds = bounds.getBounds ? bounds.getBounds() : L.latLngBounds(bounds);
                        var paddingTL = L.point(options.paddingTopLeft || options.padding || [0, 0]),
                            paddingBR = L.point(options.paddingBottomRight || options.padding || [0, 0]),
                            zoom = this.getBoundsZoom(bounds, !1, paddingTL.add(paddingBR));
                        zoom = options.maxZoom ? Math.min(options.maxZoom, zoom) : zoom;
                        var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),
                            swPoint = this.project(bounds.getSouthWest(), zoom),
                            nePoint = this.project(bounds.getNorthEast(), zoom),
                            center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);
                        return this.setView(center, zoom, options)
                    },
                    fitWorld: function(options) {
                        return this.fitBounds([
                            [-90, -180],
                            [90, 180]
                        ], options)
                    },
                    panTo: function(center, options) {
                        return this.setView(center, this._zoom, {
                            pan: options
                        })
                    },
                    panBy: function(offset) {
                        return this.fire("movestart"), this._rawPanBy(L.point(offset)), this.fire("move"), this.fire("moveend")
                    },
                    setMaxBounds: function(bounds) {
                        return bounds = L.latLngBounds(bounds), this.options.maxBounds = bounds, bounds ? (this._loaded && this._panInsideMaxBounds(), this.on("moveend", this._panInsideMaxBounds)) : this.off("moveend", this._panInsideMaxBounds)
                    },
                    panInsideBounds: function(bounds, options) {
                        var center = this.getCenter(),
                            newCenter = this._limitCenter(center, this._zoom, bounds);
                        return center.equals(newCenter) ? this : this.panTo(newCenter, options)
                    },
                    invalidateSize: function(options) {
                        if (!this._loaded) return this;
                        options = L.extend({
                            animate: !1,
                            pan: !0
                        }, options === !0 ? {
                            animate: !0
                        } : options);
                        var oldSize = this.getSize();
                        this._sizeChanged = !0, this._initialCenter = null;
                        var newSize = this.getSize(),
                            oldCenter = oldSize.divideBy(2).round(),
                            newCenter = newSize.divideBy(2).round(),
                            offset = oldCenter.subtract(newCenter);
                        return offset.x || offset.y ? (options.animate && options.pan ? this.panBy(offset) : (options.pan && this._rawPanBy(offset), this.fire("move"), options.debounceMoveend ? (clearTimeout(this._sizeTimer), this._sizeTimer = setTimeout(L.bind(this.fire, this, "moveend"), 200)) : this.fire("moveend")), this.fire("resize", {
                            oldSize: oldSize,
                            newSize: newSize
                        })) : this
                    },
                    stop: function() {
                        return L.Util.cancelAnimFrame(this._flyToFrame), this._panAnim && this._panAnim.stop(), this
                    },
                    addHandler: function(name, HandlerClass) {
                        if (!HandlerClass) return this;
                        var handler = this[name] = new HandlerClass(this);
                        return this._handlers.push(handler), this.options[name] && handler.enable(), this
                    },
                    remove: function() {
                        this._initEvents("off");
                        try {
                            delete this._container._leaflet
                        } catch (e) {
                            this._container._leaflet = undefined
                        }
                        return L.DomUtil.remove(this._mapPane), this._clearControlPos && this._clearControlPos(), this._clearHandlers(), this._loaded && this.fire("unload"), this
                    },
                    createPane: function(name, container) {
                        var className = "leaflet-pane" + (name ? " leaflet-" + name.replace("Pane", "") + "-pane" : ""),
                            pane = L.DomUtil.create("div", className, container || this._mapPane);
                        return name && (this._panes[name] = pane), pane
                    },
                    getCenter: function() {
                        return this._checkIfLoaded(), this._initialCenter && !this._moved() ? this._initialCenter : this.layerPointToLatLng(this._getCenterLayerPoint())
                    },
                    getZoom: function() {
                        return this._zoom
                    },
                    getBounds: function() {
                        var bounds = this.getPixelBounds(),
                            sw = this.unproject(bounds.getBottomLeft()),
                            ne = this.unproject(bounds.getTopRight());
                        return new L.LatLngBounds(sw, ne)
                    },
                    getMinZoom: function() {
                        return this.options.minZoom === undefined ? this._layersMinZoom || 0 : this.options.minZoom
                    },
                    getMaxZoom: function() {
                        return this.options.maxZoom === undefined ? this._layersMaxZoom === undefined ? 1 / 0 : this._layersMaxZoom : this.options.maxZoom
                    },
                    getBoundsZoom: function(bounds, inside, padding) {
                        bounds = L.latLngBounds(bounds);
                        var boundsSize, zoom = this.getMinZoom() - (inside ? 1 : 0),
                            maxZoom = this.getMaxZoom(),
                            size = this.getSize(),
                            nw = bounds.getNorthWest(),
                            se = bounds.getSouthEast(),
                            zoomNotFound = !0;
                        padding = L.point(padding || [0, 0]);
                        do zoom++, boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)).add(padding).floor(), zoomNotFound = inside ? boundsSize.x < size.x || boundsSize.y < size.y : size.contains(boundsSize); while (zoomNotFound && maxZoom >= zoom);
                        return zoomNotFound && inside ? null : inside ? zoom : zoom - 1
                    },
                    getSize: function() {
                        return (!this._size || this._sizeChanged) && (this._size = new L.Point(this._container.clientWidth, this._container.clientHeight), this._sizeChanged = !1), this._size.clone()
                    },
                    getPixelBounds: function() {
                        var topLeftPoint = this._getTopLeftPoint();
                        return new L.Bounds(topLeftPoint, topLeftPoint.add(this.getSize()))
                    },
                    getPixelOrigin: function() {
                        return this._checkIfLoaded(), this._pixelOrigin
                    },
                    getPixelWorldBounds: function(zoom) {
                        return this.options.crs.getProjectedBounds(zoom === undefined ? this.getZoom() : zoom)
                    },
                    getPane: function(pane) {
                        return "string" == typeof pane ? this._panes[pane] : pane
                    },
                    getPanes: function() {
                        return this._panes
                    },
                    getContainer: function() {
                        return this._container
                    },
                    getZoomScale: function(toZoom, fromZoom) {
                        var crs = this.options.crs;
                        return fromZoom = fromZoom === undefined ? this._zoom : fromZoom, crs.scale(toZoom) / crs.scale(fromZoom)
                    },
                    getScaleZoom: function(scale, fromZoom) {
                        return fromZoom = fromZoom === undefined ? this._zoom : fromZoom, fromZoom + Math.log(scale) / Math.LN2
                    },
                    project: function(latlng, zoom) {
                        return zoom = zoom === undefined ? this._zoom : zoom, this.options.crs.latLngToPoint(L.latLng(latlng), zoom)
                    },
                    unproject: function(point, zoom) {
                        return zoom = zoom === undefined ? this._zoom : zoom, this.options.crs.pointToLatLng(L.point(point), zoom)
                    },
                    layerPointToLatLng: function(point) {
                        var projectedPoint = L.point(point).add(this.getPixelOrigin());
                        return this.unproject(projectedPoint)
                    },
                    latLngToLayerPoint: function(latlng) {
                        var projectedPoint = this.project(L.latLng(latlng))._round();
                        return projectedPoint._subtract(this.getPixelOrigin())
                    },
                    wrapLatLng: function(latlng) {
                        return this.options.crs.wrapLatLng(L.latLng(latlng))
                    },
                    distance: function(latlng1, latlng2) {
                        return this.options.crs.distance(L.latLng(latlng1), L.latLng(latlng2))
                    },
                    containerPointToLayerPoint: function(point) {
                        return L.point(point).subtract(this._getMapPanePos())
                    },
                    layerPointToContainerPoint: function(point) {
                        return L.point(point).add(this._getMapPanePos())
                    },
                    containerPointToLatLng: function(point) {
                        var layerPoint = this.containerPointToLayerPoint(L.point(point));
                        return this.layerPointToLatLng(layerPoint)
                    },
                    latLngToContainerPoint: function(latlng) {
                        return this.layerPointToContainerPoint(this.latLngToLayerPoint(L.latLng(latlng)))
                    },
                    mouseEventToContainerPoint: function(e) {
                        return L.DomEvent.getMousePosition(e, this._container)
                    },
                    mouseEventToLayerPoint: function(e) {
                        return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e))
                    },
                    mouseEventToLatLng: function(e) {
                        return this.layerPointToLatLng(this.mouseEventToLayerPoint(e))
                    },
                    _initContainer: function(id) {
                        var container = this._container = L.DomUtil.get(id);
                        if (!container) throw new Error("Map container not found.");
                        if (container._leaflet) throw new Error("Map container is already initialized.");
                        container._leaflet = !0
                    },
                    _initLayout: function() {
                        var container = this._container;
                        this._fadeAnimated = this.options.fadeAnimation && L.Browser.any3d, L.DomUtil.addClass(container, "leaflet-container" + (L.Browser.touch ? " leaflet-touch" : "") + (L.Browser.retina ? " leaflet-retina" : "") + (L.Browser.ielt9 ? " leaflet-oldie" : "") + (L.Browser.safari ? " leaflet-safari" : "") + (this._fadeAnimated ? " leaflet-fade-anim" : ""));
                        var position = L.DomUtil.getStyle(container, "position");
                        "absolute" !== position && "relative" !== position && "fixed" !== position && (container.style.position = "relative"), this._initPanes(), this._initControlPos && this._initControlPos()
                    },
                    _initPanes: function() {
                        var panes = this._panes = {};
                        this._mapPane = this.createPane("mapPane", this._container), this.createPane("tilePane"), this.createPane("shadowPane"), this.createPane("overlayPane"), this.createPane("markerPane"), this.createPane("popupPane"), this.options.markerZoomAnimation || (L.DomUtil.addClass(panes.markerPane, "leaflet-zoom-hide"), L.DomUtil.addClass(panes.shadowPane, "leaflet-zoom-hide"))
                    },
                    _resetView: function(center, zoom, preserveMapOffset, afterZoomAnim) {
                        var zoomChanged = this._zoom !== zoom;
                        afterZoomAnim || (this.fire("movestart"), zoomChanged && this.fire("zoomstart")), this._zoom = zoom, this._initialCenter = center, preserveMapOffset || L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0)), this._pixelOrigin = this._getNewPixelOrigin(center);
                        var loading = !this._loaded;
                        this._loaded = !0, this.fire("viewreset", {
                            hard: !preserveMapOffset
                        }), loading && this.fire("load"), this.fire("move"), (zoomChanged || afterZoomAnim) && this.fire("zoomend"), this.fire("moveend", {
                            hard: !preserveMapOffset
                        })
                    },
                    _rawPanBy: function(offset) {
                        L.DomUtil.setPosition(this._mapPane, this._getMapPanePos().subtract(offset))
                    },
                    _getZoomSpan: function() {
                        return this.getMaxZoom() - this.getMinZoom()
                    },
                    _panInsideMaxBounds: function() {
                        this.panInsideBounds(this.options.maxBounds)
                    },
                    _checkIfLoaded: function() {
                        if (!this._loaded) throw new Error("Set map center and zoom first.")
                    },
                    _initEvents: function(onOff) {
                        L.DomEvent && (onOff = onOff || "on", L.DomEvent[onOff](this._container, "click dblclick mousedown mouseup mouseenter mouseleave mousemove contextmenu", this._handleMouseEvent, this), this.options.trackResize && L.DomEvent[onOff](window, "resize", this._onResize, this))
                    },
                    _onResize: function() {
                        L.Util.cancelAnimFrame(this._resizeRequest), this._resizeRequest = L.Util.requestAnimFrame(function() {
                            this.invalidateSize({
                                debounceMoveend: !0
                            })
                        }, this, !1, this._container)
                    },
                    _handleMouseEvent: function(e) {
                        this._loaded && this._fireMouseEvent(this, e, "mouseenter" === e.type ? "mouseover" : "mouseleave" === e.type ? "mouseout" : e.type)
                    },
                    _fireMouseEvent: function(obj, e, type, propagate, latlng) {
                        if (type = type || e.type, !L.DomEvent._skipped(e)) {
                            if ("click" === type) {
                                var draggableObj = obj.options.draggable === !0 ? obj : this;
                                if (!e._simulated && (draggableObj.dragging && draggableObj.dragging.moved() || this.boxZoom && this.boxZoom.moved())) return void L.DomEvent.stopPropagation(e);
                                obj.fire("preclick")
                            }
                            if (obj.listens(type, propagate)) {
                                "contextmenu" === type && L.DomEvent.preventDefault(e), ("click" === type || "dblclick" === type || "contextmenu" === type) && L.DomEvent.stopPropagation(e);
                                var data = {
                                    originalEvent: e,
                                    containerPoint: this.mouseEventToContainerPoint(e)
                                };
                                data.layerPoint = this.containerPointToLayerPoint(data.containerPoint), data.latlng = latlng || this.layerPointToLatLng(data.layerPoint), obj.fire(type, data, propagate)
                            }
                        }
                    },
                    _clearHandlers: function() {
                        for (var i = 0, len = this._handlers.length; len > i; i++) this._handlers[i].disable()
                    },
                    whenReady: function(callback, context) {
                        return this._loaded ? callback.call(context || this, {
                            target: this
                        }) : this.on("load", callback, context), this
                    },
                    _getMapPanePos: function() {
                        return L.DomUtil.getPosition(this._mapPane) || new L.Point(0, 0)
                    },
                    _moved: function() {
                        var pos = this._getMapPanePos();
                        return pos && !pos.equals([0, 0])
                    },
                    _getTopLeftPoint: function() {
                        return this.getPixelOrigin().subtract(this._getMapPanePos())
                    },
                    _getNewPixelOrigin: function(center, zoom) {
                        var viewHalf = this.getSize()._divideBy(2);
                        return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos())._round()
                    },
                    _latLngToNewLayerPoint: function(latlng, zoom, center) {
                        var topLeft = this._getNewPixelOrigin(center, zoom);
                        return this.project(latlng, zoom)._subtract(topLeft)
                    },
                    _getCenterLayerPoint: function() {
                        return this.containerPointToLayerPoint(this.getSize()._divideBy(2))
                    },
                    _getCenterOffset: function(latlng) {
                        return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint())
                    },
                    _limitCenter: function(center, zoom, bounds) {
                        if (!bounds) return center;
                        var centerPoint = this.project(center, zoom),
                            viewHalf = this.getSize().divideBy(2),
                            viewBounds = new L.Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
                            offset = this._getBoundsOffset(viewBounds, bounds, zoom);
                        return this.unproject(centerPoint.add(offset), zoom)
                    },
                    _limitOffset: function(offset, bounds) {
                        if (!bounds) return offset;
                        var viewBounds = this.getPixelBounds(),
                            newBounds = new L.Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));
                        return offset.add(this._getBoundsOffset(newBounds, bounds))
                    },
                    _getBoundsOffset: function(pxBounds, maxBounds, zoom) {
                        var nwOffset = this.project(maxBounds.getNorthWest(), zoom).subtract(pxBounds.min),
                            seOffset = this.project(maxBounds.getSouthEast(), zoom).subtract(pxBounds.max),
                            dx = this._rebound(nwOffset.x, -seOffset.x),
                            dy = this._rebound(nwOffset.y, -seOffset.y);
                        return new L.Point(dx, dy)
                    },
                    _rebound: function(left, right) {
                        return left + right > 0 ? Math.round(left - right) / 2 : Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right))
                    },
                    _limitZoom: function(zoom) {
                        var min = this.getMinZoom(),
                            max = this.getMaxZoom();
                        return Math.max(min, Math.min(max, zoom))
                    }
                }), L.map = function(id, options) {
                    return new L.Map(id, options)
                }, L.Layer = L.Evented.extend({
                    options: {
                        pane: "overlayPane"
                    },
                    addTo: function(map) {
                        return map.addLayer(this), this
                    },
                    remove: function() {
                        return this.removeFrom(this._map || this._mapToAdd)
                    },
                    removeFrom: function(obj) {
                        return obj && obj.removeLayer(this), this
                    },
                    getPane: function(name) {
                        return this._map.getPane(name ? this.options[name] || name : this.options.pane)
                    },
                    _layerAdd: function(e) {
                        var map = e.target;
                        map.hasLayer(this) && (this._map = map, this._zoomAnimated = map._zoomAnimated, this.onAdd(map), this.getAttribution && this._map.attributionControl && this._map.attributionControl.addAttribution(this.getAttribution()), this.getEvents && map.on(this.getEvents(), this), this.fire("add"), map.fire("layeradd", {
                            layer: this
                        }))
                    }
                }), L.Map.include({
                    addLayer: function(layer) {
                        var id = L.stamp(layer);
                        return this._layers[id] ? layer : (this._layers[id] = layer, layer._mapToAdd = this, layer.beforeAdd && layer.beforeAdd(this), this.whenReady(layer._layerAdd, layer), this)
                    },
                    removeLayer: function(layer) {
                        var id = L.stamp(layer);
                        return this._layers[id] ? (this._loaded && layer.onRemove(this), layer.getAttribution && this.attributionControl && this.attributionControl.removeAttribution(layer.getAttribution()), layer.getEvents && this.off(layer.getEvents(), layer), delete this._layers[id], this._loaded && (this.fire("layerremove", {
                            layer: layer
                        }), layer.fire("remove")), layer._map = layer._mapToAdd = null, this) : this
                    },
                    hasLayer: function(layer) {
                        return !!layer && L.stamp(layer) in this._layers
                    },
                    eachLayer: function(method, context) {
                        for (var i in this._layers) method.call(context, this._layers[i]);
                        return this
                    },
                    _addLayers: function(layers) {
                        layers = layers ? L.Util.isArray(layers) ? layers : [layers] : [];
                        for (var i = 0, len = layers.length; len > i; i++) this.addLayer(layers[i])
                    },
                    _addZoomLimit: function(layer) {
                        (isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom)) && (this._zoomBoundLayers[L.stamp(layer)] = layer, this._updateZoomLevels())
                    },
                    _removeZoomLimit: function(layer) {
                        var id = L.stamp(layer);
                        this._zoomBoundLayers[id] && (delete this._zoomBoundLayers[id], this._updateZoomLevels())
                    },
                    _updateZoomLevels: function() {
                        var minZoom = 1 / 0,
                            maxZoom = -(1 / 0),
                            oldZoomSpan = this._getZoomSpan();
                        for (var i in this._zoomBoundLayers) {
                            var options = this._zoomBoundLayers[i].options;
                            minZoom = options.minZoom === undefined ? minZoom : Math.min(minZoom, options.minZoom), maxZoom = options.maxZoom === undefined ? maxZoom : Math.max(maxZoom, options.maxZoom)
                        }
                        this._layersMaxZoom = maxZoom === -(1 / 0) ? undefined : maxZoom, this._layersMinZoom = minZoom === 1 / 0 ? undefined : minZoom, oldZoomSpan !== this._getZoomSpan() && this.fire("zoomlevelschange")
                    }
                }), L.Projection.Mercator = {
                    R: 6378137,
                    R_MINOR: 6356752.314245179,
                    bounds: L.bounds([-20037508.34279, -15496570.73972], [20037508.34279, 18764656.23138]),
                    project: function(latlng) {
                        var d = Math.PI / 180,
                            r = this.R,
                            y = latlng.lat * d,
                            tmp = this.R_MINOR / r,
                            e = Math.sqrt(1 - tmp * tmp),
                            con = e * Math.sin(y),
                            ts = Math.tan(Math.PI / 4 - y / 2) / Math.pow((1 - con) / (1 + con), e / 2);
                        return y = -r * Math.log(Math.max(ts, 1e-10)), new L.Point(latlng.lng * d * r, y)
                    },
                    unproject: function(point) {
                        for (var con, d = 180 / Math.PI, r = this.R, tmp = this.R_MINOR / r, e = Math.sqrt(1 - tmp * tmp), ts = Math.exp(-point.y / r), phi = Math.PI / 2 - 2 * Math.atan(ts), i = 0, dphi = .1; 15 > i && Math.abs(dphi) > 1e-7; i++) con = e * Math.sin(phi), con = Math.pow((1 - con) / (1 + con), e / 2), dphi = Math.PI / 2 - 2 * Math.atan(ts * con) - phi, phi += dphi;
                        return new L.LatLng(phi * d, point.x * d / r)
                    }
                }, L.CRS.EPSG3395 = L.extend({}, L.CRS.Earth, {
                    code: "EPSG:3395",
                    projection: L.Projection.Mercator,
                    transformation: function() {
                        var scale = .5 / (Math.PI * L.Projection.Mercator.R);
                        return new L.Transformation(scale, .5, -scale, .5)
                    }()
                }), L.GridLayer = L.Layer.extend({
                    options: {
                        pane: "tilePane",
                        tileSize: 256,
                        opacity: 1,
                        unloadInvisibleTiles: L.Browser.mobile,
                        updateWhenIdle: L.Browser.mobile,
                        updateInterval: 200,
                        attribution: null,
                        zIndex: null,
                        bounds: null,
                        minZoom: 0
                    },
                    initialize: function(options) {
                        options = L.setOptions(this, options)
                    },
                    onAdd: function() {
                        this._initContainer(), this._pruneTiles = L.Util.throttle(this._pruneTiles, 200, this), this._levels = {}, this._tiles = {}, this._loaded = {}, this._retain = {}, this._tilesToLoad = 0, this._reset(), this._update()
                    },
                    beforeAdd: function(map) {
                        map._addZoomLimit(this)
                    },
                    onRemove: function(map) {
                        L.DomUtil.remove(this._container), map._removeZoomLimit(this), this._container = null, this._tileZoom = null
                    },
                    bringToFront: function() {
                        return this._map && (L.DomUtil.toFront(this._container), this._setAutoZIndex(Math.max)), this
                    },
                    bringToBack: function() {
                        return this._map && (L.DomUtil.toBack(this._container), this._setAutoZIndex(Math.min)), this
                    },
                    getAttribution: function() {
                        return this.options.attribution
                    },
                    getContainer: function() {
                        return this._container
                    },
                    setOpacity: function(opacity) {
                        return this.options.opacity = opacity, this._map && this._updateOpacity(), this
                    },
                    setZIndex: function(zIndex) {
                        return this.options.zIndex = zIndex, this._updateZIndex(), this
                    },
                    redraw: function() {
                        return this._map && (this._removeAllTiles(), this._update()), this
                    },
                    getEvents: function() {
                        var events = {
                            viewreset: this._reset,
                            moveend: this._update
                        };
                        return this.options.updateWhenIdle || (events.move = L.Util.throttle(this._update, this.options.updateInterval, this)), this._zoomAnimated && (events.zoomanim = this._animateZoom), events
                    },
                    createTile: function() {
                        return document.createElement("div")
                    },
                    _updateZIndex: function() {
                        this._container && this.options.zIndex !== undefined && null !== this.options.zIndex && (this._container.style.zIndex = this.options.zIndex)
                    },
                    _setAutoZIndex: function(compare) {
                        for (var zIndex, layers = this.getPane().children, edgeZIndex = -compare(-(1 / 0), 1 / 0), i = 0, len = layers.length; len > i; i++) zIndex = layers[i].style.zIndex, layers[i] !== this._container && zIndex && (edgeZIndex = compare(edgeZIndex, +zIndex));
                        isFinite(edgeZIndex) && (this.options.zIndex = edgeZIndex + compare(-1, 1), this._updateZIndex())
                    },
                    _updateOpacity: function() {
                        var opacity = this.options.opacity;
                        if (L.Browser.ielt9)
                            for (var i in this._tiles) L.DomUtil.setOpacity(this._tiles[i], opacity);
                        else L.DomUtil.setOpacity(this._container, opacity)
                    },
                    _initContainer: function() {
                        this._container || (this._container = L.DomUtil.create("div", "leaflet-layer"), this._updateZIndex(), this.options.opacity < 1 && this._updateOpacity(), this.getPane().appendChild(this._container))
                    },
                    _updateLevels: function() {
                        var zoom = this._tileZoom;
                        for (var z in this._levels) this._levels[z].el.style.zIndex = -Math.abs(zoom - z);
                        var level = this._levels[zoom],
                            map = this._map;
                        return level || (level = this._levels[zoom] = {}, level.el = L.DomUtil.create("div", "leaflet-tile-container leaflet-zoom-animated", this._container), level.el.style.zIndex = 0, level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round(), level.zoom = zoom), this._level = level, level
                    },
                    _pruneTiles: function() {
                        if (this._map) {
                            this._retain = {};
                            var i, j, key, found, bounds = this._map.getBounds(),
                                z = this._tileZoom,
                                range = this._getTileRange(bounds, z);
                            for (i = range.min.x; i <= range.max.x; i++)
                                for (j = range.min.y; j <= range.max.y; j++) key = i + ":" + j + ":" + z, this._retain[key] = !0, this._loaded[key] || (found = this._retainParent(i, j, z, z - 5) || this._retainChildren(i, j, z, z + 2));
                            for (key in this._tiles) this._retain[key] || (this._loaded[key] ? this._map._fadeAnimated ? setTimeout(L.bind(this._deferRemove, this, key), 250) : this._removeTile(key) : (this._removeTile(key), this._tilesToLoad--))
                        }
                    },
                    _removeAllTiles: function() {
                        for (var key in this._tiles) this._removeTile(key);
                        this._tilesToLoad = 0
                    },
                    _deferRemove: function(key) {
                        this._retain[key] || this._removeTile(key)
                    },
                    _retainParent: function(x, y, z, minZoom) {
                        var x2 = Math.floor(x / 2),
                            y2 = Math.floor(y / 2),
                            z2 = z - 1,
                            key = x2 + ":" + y2 + ":" + z2;
                        return this._loaded[key] ? (this._retain[key] = !0, !0) : z2 > minZoom ? this._retainParent(x2, y2, z2, minZoom) : !1
                    },
                    _retainChildren: function(x, y, z, maxZoom) {
                        for (var i = 2 * x; 2 * x + 2 > i; i++)
                            for (var j = 2 * y; 2 * y + 2 > j; j++) {
                                var key = i + ":" + j + ":" + (z + 1);
                                this._loaded[key] ? this._retain[key] = !0 : maxZoom > z + 1 && this._retainChildren(i, j, z + 1, maxZoom)
                            }
                    },
                    _reset: function(e) {
                        var map = this._map,
                            zoom = map.getZoom(),
                            tileZoom = Math.round(zoom),
                            tileZoomChanged = this._tileZoom !== tileZoom;
                        (tileZoomChanged || e && e.hard) && (this._abortLoading && this._abortLoading(), this._tileZoom = tileZoom, this._updateLevels(), this._resetGrid()), this._setZoomTransforms(map.getCenter(), zoom)
                    },
                    _setZoomTransforms: function(center, zoom) {
                        for (var i in this._levels) this._setZoomTransform(this._levels[i], center, zoom)
                    },
                    _setZoomTransform: function(level, center, zoom) {
                        var scale = this._map.getZoomScale(zoom, level.zoom),
                            translate = level.origin.multiplyBy(scale).subtract(this._map._getNewPixelOrigin(center, zoom)).round();
                        L.DomUtil.setTransform(level.el, translate, scale)
                    },
                    _resetGrid: function() {
                        var map = this._map,
                            crs = map.options.crs,
                            tileSize = this._tileSize = this._getTileSize(),
                            tileZoom = this._tileZoom,
                            bounds = this._map.getPixelWorldBounds(this._tileZoom);
                        bounds && (this._globalTileRange = this._pxBoundsToTileRange(bounds)), this._wrapX = crs.wrapLng && [Math.floor(map.project([0, crs.wrapLng[0]], tileZoom).x / tileSize), Math.ceil(map.project([0, crs.wrapLng[1]], tileZoom).x / tileSize)], this._wrapY = crs.wrapLat && [Math.floor(map.project([crs.wrapLat[0], 0], tileZoom).y / tileSize), Math.ceil(map.project([crs.wrapLat[1], 0], tileZoom).y / tileSize)]
                    },
                    _getTileSize: function() {
                        return this.options.tileSize
                    },
                    _update: function() {
                        if (this._map) {
                            var bounds = this._map.getBounds();
                            this.options.unloadInvisibleTiles && this._removeOtherTiles(bounds), this._addTiles(bounds)
                        }
                    },
                    _getTileRange: function(bounds, zoom) {
                        var pxBounds = new L.Bounds(this._map.project(bounds.getNorthWest(), zoom), this._map.project(bounds.getSouthEast(), zoom));
                        return this._pxBoundsToTileRange(pxBounds)
                    },
                    _addTiles: function(bounds) {
                        var j, i, coords, queue = [],
                            tileRange = this._getTileRange(bounds, this._tileZoom),
                            center = tileRange.getCenter();
                        for (j = tileRange.min.y; j <= tileRange.max.y; j++)
                            for (i = tileRange.min.x; i <= tileRange.max.x; i++) coords = new L.Point(i, j), coords.z = this._tileZoom, this._tileCoordsToKey(coords) in this._tiles || !this._isValidTile(coords) || queue.push(coords);
                        queue.sort(function(a, b) {
                            return a.distanceTo(center) - b.distanceTo(center)
                        });
                        var tilesToLoad = queue.length;
                        if (0 !== tilesToLoad) {
                            this._tilesToLoad || this.fire("loading"), this._tilesToLoad += tilesToLoad;
                            var fragment = document.createDocumentFragment();
                            for (i = 0; tilesToLoad > i; i++) this._addTile(queue[i], fragment);
                            this._level.el.appendChild(fragment)
                        }
                        this._pruneTiles()
                    },
                    _isValidTile: function(coords) {
                        var crs = this._map.options.crs;
                        if (!crs.infinite) {
                            var bounds = this._globalTileRange;
                            if (!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x) || !crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y)) return !1
                        }
                        if (!this.options.bounds) return !0;
                        var tileBounds = this._tileCoordsToBounds(coords);
                        return L.latLngBounds(this.options.bounds).intersects(tileBounds)
                    },
                    _keyToBounds: function(key) {
                        return this._tileCoordsToBounds(this._keyToTileCoords(key))
                    },
                    _tileCoordsToBounds: function(coords) {
                        var map = this._map,
                            tileSize = this._getTileSize(),
                            nwPoint = coords.multiplyBy(tileSize),
                            sePoint = nwPoint.add([tileSize, tileSize]),
                            nw = map.wrapLatLng(map.unproject(nwPoint, coords.z)),
                            se = map.wrapLatLng(map.unproject(sePoint, coords.z));
                        return new L.LatLngBounds(nw, se)
                    },
                    _tileCoordsToKey: function(coords) {
                        return coords.x + ":" + coords.y + ":" + coords.z
                    },
                    _keyToTileCoords: function(key) {
                        var k = key.split(":"),
                            coords = new L.Point(+k[0], +k[1]);
                        return coords.z = +k[2], coords
                    },
                    _removeOtherTiles: function(bounds) {
                        for (var key in this._tiles) {
                            var tileBounds = this._keyToBounds(key);
                            bounds.intersects(tileBounds) || this._removeTile(key)
                        }
                    },
                    _removeTile: function(key) {
                        var tile = this._tiles[key];
                        tile && (L.DomUtil.remove(tile), delete this._tiles[key], delete this._loaded[key], this.fire("tileunload", {
                            tile: tile,
                            coords: this._keyToTileCoords(key)
                        }))
                    },
                    _initTile: function(tile) {
                        L.DomUtil.addClass(tile, "leaflet-tile"), tile.style.width = this._tileSize + "px", tile.style.height = this._tileSize + "px", tile.onselectstart = L.Util.falseFn, tile.onmousemove = L.Util.falseFn, L.Browser.ielt9 && this.options.opacity < 1 && L.DomUtil.setOpacity(tile, this.options.opacity), L.Browser.android && !L.Browser.android23 && (tile.style.WebkitBackfaceVisibility = "hidden")
                    },
                    _addTile: function(coords, container) {
                        var tilePos = this._getTilePos(coords),
                            key = this._tileCoordsToKey(coords),
                            tile = this.createTile(this._wrapCoords(coords), L.bind(this._tileReady, this, coords));
                        this._initTile(tile), this.createTile.length < 2 && setTimeout(L.bind(this._tileReady, this, coords, null, tile), 0), L.DomUtil.setPosition(tile, tilePos, !0), this._tiles[key] = tile, container.appendChild(tile), this.fire("tileloadstart", {
                            tile: tile,
                            coords: coords
                        })
                    },
                    _tileReady: function(coords, err, tile) {
                        err && this.fire("tileerror", {
                            error: err,
                            tile: tile,
                            coords: coords
                        });
                        var key = this._tileCoordsToKey(coords);
                        this._tiles[key] && (this._loaded[key] = !0, this._pruneTiles(), L.DomUtil.addClass(tile, "leaflet-tile-loaded"), this.fire("tileload", {
                            tile: tile,
                            coords: coords
                        }), this._tilesToLoad--, 0 === this._tilesToLoad && this.fire("load"))
                    },
                    _getTilePos: function(coords) {
                        return coords.multiplyBy(this._tileSize).subtract(this._level.origin)
                    },
                    _wrapCoords: function(coords) {
                        var newCoords = new L.Point(this._wrapX ? L.Util.wrapNum(coords.x, this._wrapX) : coords.x, this._wrapY ? L.Util.wrapNum(coords.y, this._wrapY) : coords.y);
                        return newCoords.z = coords.z, newCoords
                    },
                    _pxBoundsToTileRange: function(bounds) {
                        return new L.Bounds(bounds.min.divideBy(this._tileSize).floor(), bounds.max.divideBy(this._tileSize).ceil().subtract([1, 1]))
                    },
                    _animateZoom: function(e) {
                        this._setZoomTransforms(e.center, e.zoom)
                    }
                }), L.gridLayer = function(options) {
                    return new L.GridLayer(options)
                }, L.TileLayer = L.GridLayer.extend({
                    options: {
                        maxZoom: 18,
                        subdomains: "abc",
                        errorTileUrl: "",
                        zoomOffset: 0,
                        maxNativeZoom: null,
                        tms: !1,
                        zoomReverse: !1,
                        detectRetina: !1,
                        crossOrigin: !1
                    },
                    initialize: function(url, options) {
                        this._url = url, options = L.setOptions(this, options), options.detectRetina && L.Browser.retina && options.maxZoom > 0 && (options.tileSize = Math.floor(options.tileSize / 2), options.zoomOffset++, options.minZoom = Math.max(0, options.minZoom), options.maxZoom--), "string" == typeof options.subdomains && (options.subdomains = options.subdomains.split("")), L.Browser.android || this.on("tileunload", this._onTileRemove)
                    },
                    setUrl: function(url, noRedraw) {
                        return this._url = url, noRedraw || this.redraw(), this
                    },
                    createTile: function(coords, done) {
                        var tile = document.createElement("img");
                        return tile.onload = L.bind(this._tileOnLoad, this, done, tile), tile.onerror = L.bind(this._tileOnError, this, done, tile), this.options.crossOrigin && (tile.crossOrigin = ""), tile.alt = "", tile.src = this.getTileUrl(coords), tile
                    },
                    getTileUrl: function(coords) {
                        return L.Util.template(this._url, L.extend({
                            r: this.options.detectRetina && L.Browser.retina && this.options.maxZoom > 0 ? "@2x" : "",
                            s: this._getSubdomain(coords),
                            x: coords.x,
                            y: this.options.tms ? this._globalTileRange.max.y - coords.y : coords.y,
                            z: this._getZoomForUrl()
                        }, this.options))
                    },
                    _tileOnLoad: function(done, tile) {
                        done(null, tile)
                    },
                    _tileOnError: function(done, tile, e) {
                        var errorUrl = this.options.errorTileUrl;
                        errorUrl && (tile.src = errorUrl), done(e, tile)
                    },
                    _getTileSize: function() {
                        var map = this._map,
                            options = this.options,
                            zoom = map.getZoom() + options.zoomOffset,
                            zoomN = options.maxNativeZoom;
                        return null !== zoomN && zoom > zoomN ? Math.round(map.getZoomScale(zoomN, zoom) * options.tileSize) : options.tileSize
                    },
                    _onTileRemove: function(e) {
                        e.tile.onload = null, e.tile.src = L.Util.emptyImageUrl
                    },
                    _getZoomForUrl: function() {
                        var options = this.options,
                            zoom = this._tileZoom;
                        return options.zoomReverse && (zoom = options.maxZoom - zoom), zoom += options.zoomOffset, options.maxNativeZoom ? Math.min(zoom, options.maxNativeZoom) : zoom
                    },
                    _getSubdomain: function(tilePoint) {
                        var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
                        return this.options.subdomains[index]
                    },
                    _abortLoading: function() {
                        var i, tile;
                        for (i in this._tiles) tile = this._tiles[i], tile.onload = L.Util.falseFn, tile.onerror = L.Util.falseFn, tile.complete || (tile.src = L.Util.emptyImageUrl, L.DomUtil.remove(tile))
                    }
                }), L.tileLayer = function(url, options) {
                    return new L.TileLayer(url, options)
                }, L.TileLayer.WMS = L.TileLayer.extend({
                    defaultWmsParams: {
                        service: "WMS",
                        request: "GetMap",
                        version: "1.1.1",
                        layers: "",
                        styles: "",
                        format: "image/jpeg",
                        transparent: !1
                    },
                    options: {
                        crs: null,
                        uppercase: !1
                    },
                    initialize: function(url, options) {
                        this._url = url;
                        var wmsParams = L.extend({}, this.defaultWmsParams);
                        for (var i in options) i in this.options || (wmsParams[i] = options[i]);
                        options = L.setOptions(this, options), wmsParams.width = wmsParams.height = options.tileSize * (options.detectRetina && L.Browser.retina ? 2 : 1), this.wmsParams = wmsParams
                    },
                    onAdd: function(map) {
                        this._crs = this.options.crs || map.options.crs, this._wmsVersion = parseFloat(this.wmsParams.version);
                        var projectionKey = this._wmsVersion >= 1.3 ? "crs" : "srs";
                        this.wmsParams[projectionKey] = this._crs.code, L.TileLayer.prototype.onAdd.call(this, map)
                    },
                    getTileUrl: function(coords) {
                        var tileBounds = this._tileCoordsToBounds(coords),
                            nw = this._crs.project(tileBounds.getNorthWest()),
                            se = this._crs.project(tileBounds.getSouthEast()),
                            bbox = (this._wmsVersion >= 1.3 && this._crs === L.CRS.EPSG4326 ? [se.y, nw.x, nw.y, se.x] : [nw.x, se.y, se.x, nw.y]).join(","),
                            url = L.TileLayer.prototype.getTileUrl.call(this, coords);
                        return url + L.Util.getParamString(this.wmsParams, url, this.options.uppercase) + (this.options.uppercase ? "&BBOX=" : "&bbox=") + bbox
                    },
                    setParams: function(params, noRedraw) {
                        return L.extend(this.wmsParams, params), noRedraw || this.redraw(), this
                    }
                }), L.tileLayer.wms = function(url, options) {
                    return new L.TileLayer.WMS(url, options)
                }, L.ImageOverlay = L.Layer.extend({
                    options: {
                        opacity: 1,
                        alt: "",
                        interactive: !1
                    },
                    initialize: function(url, bounds, options) {
                        this._url = url, this._bounds = L.latLngBounds(bounds), L.setOptions(this, options)
                    },
                    onAdd: function() {
                        this._image || (this._initImage(), this.options.opacity < 1 && this._updateOpacity()), this.getPane().appendChild(this._image), this._initInteraction(), this._reset()
                    },
                    onRemove: function() {
                        L.DomUtil.remove(this._image)
                    },
                    setOpacity: function(opacity) {
                        return this.options.opacity = opacity, this._image && this._updateOpacity(), this
                    },
                    setStyle: function(styleOpts) {
                        return styleOpts.opacity && this.setOpacity(styleOpts.opacity), this
                    },
                    bringToFront: function() {
                        return this._map && L.DomUtil.toFront(this._image), this
                    },
                    bringToBack: function() {
                        return this._map && L.DomUtil.toBack(this._image), this
                    },
                    _initInteraction: function() {
                        this.options.interactive && (L.DomUtil.addClass(this._image, "leaflet-interactive"), L.DomEvent.on(this._image, "click dblclick mousedown mouseup mouseover mousemove mouseout contextmenu", this._fireMouseEvent, this))
                    },
                    _fireMouseEvent: function(e, type) {
                        this._map && this._map._fireMouseEvent(this, e, type, !0)
                    },
                    setUrl: function(url) {
                        return this._url = url, this._image && (this._image.src = url), this
                    },
                    getAttribution: function() {
                        return this.options.attribution
                    },
                    getEvents: function() {
                        var events = {
                            viewreset: this._reset
                        };
                        return this._zoomAnimated && (events.zoomanim = this._animateZoom), events
                    },
                    getBounds: function() {
                        return this._bounds
                    },
                    _initImage: function() {
                        var img = this._image = L.DomUtil.create("img", "leaflet-image-layer " + (this._zoomAnimated ? "leaflet-zoom-animated" : ""));
                        img.onselectstart = L.Util.falseFn, img.onmousemove = L.Util.falseFn, img.onload = L.bind(this.fire, this, "load"), img.src = this._url, img.alt = this.options.alt
                    },
                    _animateZoom: function(e) {
                        var bounds = new L.Bounds(this._map._latLngToNewLayerPoint(this._bounds.getNorthWest(), e.zoom, e.center), this._map._latLngToNewLayerPoint(this._bounds.getSouthEast(), e.zoom, e.center)),
                            offset = bounds.min.add(bounds.getSize()._multiplyBy((1 - 1 / e.scale) / 2));
                        L.DomUtil.setTransform(this._image, offset, e.scale)
                    },
                    _reset: function() {
                        var image = this._image,
                            bounds = new L.Bounds(this._map.latLngToLayerPoint(this._bounds.getNorthWest()), this._map.latLngToLayerPoint(this._bounds.getSouthEast())),
                            size = bounds.getSize();
                        L.DomUtil.setPosition(image, bounds.min), image.style.width = size.x + "px", image.style.height = size.y + "px"
                    },
                    _updateOpacity: function() {
                        L.DomUtil.setOpacity(this._image, this.options.opacity)
                    }
                }), L.imageOverlay = function(url, bounds, options) {
                    return new L.ImageOverlay(url, bounds, options)
                }, L.Icon = L.Class.extend({
                    initialize: function(options) {
                        L.setOptions(this, options)
                    },
                    createIcon: function(oldIcon) {
                        return this._createIcon("icon", oldIcon)
                    },
                    createShadow: function(oldIcon) {
                        return this._createIcon("shadow", oldIcon)
                    },
                    _createIcon: function(name, oldIcon) {
                        var src = this._getIconUrl(name);
                        if (!src) {
                            if ("icon" === name) throw new Error("iconUrl not set in Icon options (see the docs).");
                            return null
                        }
                        var img = this._createImg(src, oldIcon && "IMG" === oldIcon.tagName ? oldIcon : null);
                        return this._setIconStyles(img, name), img
                    },
                    _setIconStyles: function(img, name) {
                        var options = this.options,
                            size = L.point(options[name + "Size"]),
                            anchor = L.point("shadow" === name && options.shadowAnchor || options.iconAnchor || size && size.divideBy(2, !0));
                        img.className = "leaflet-marker-" + name + " " + (options.className || ""), anchor && (img.style.marginLeft = -anchor.x + "px", img.style.marginTop = -anchor.y + "px"), size && (img.style.width = size.x + "px", img.style.height = size.y + "px")
                    },
                    _createImg: function(src, el) {
                        return el = el || document.createElement("img"), el.src = src, el
                    },
                    _getIconUrl: function(name) {
                        return L.Browser.retina && this.options[name + "RetinaUrl"] || this.options[name + "Url"]
                    }
                }), L.icon = function(options) {
                    return new L.Icon(options)
                }, L.Icon.Default = L.Icon.extend({
                    options: {
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    },
                    _getIconUrl: function(name) {
                        var key = name + "Url";
                        if (this.options[key]) return this.options[key];
                        var path = L.Icon.Default.imagePath;
                        if (!path) throw new Error("Couldn't autodetect L.Icon.Default.imagePath, set it manually.");
                        return path + "/marker-" + name + (L.Browser.retina && "icon" === name ? "-2x" : "") + ".png"
                    }
                }), L.Icon.Default.imagePath = function() {
                    var i, len, src, path, scripts = document.getElementsByTagName("script"),
                        leafletRe = /[\/^]leaflet[\-\._]?([\w\-\._]*)\.js\??/;
                    for (i = 0, len = scripts.length; len > i; i++)
                        if (src = scripts[i].src, src.match(leafletRe)) return path = src.split(leafletRe)[0], (path ? path + "/" : "") + "images"
                }(), L.Marker = L.Layer.extend({
                    options: {
                        pane: "markerPane",
                        icon: new L.Icon.Default,
                        interactive: !0,
                        keyboard: !0,
                        zIndexOffset: 0,
                        opacity: 1,
                        riseOffset: 250
                    },
                    initialize: function(latlng, options) {
                        L.setOptions(this, options), this._latlng = L.latLng(latlng)
                    },
                    onAdd: function(map) {
                        this._zoomAnimated = this._zoomAnimated && map.options.markerZoomAnimation, this._initIcon(), this.update()
                    },
                    onRemove: function() {
                        this.dragging && this.dragging.disable(), this._removeIcon(), this._removeShadow()
                    },
                    getEvents: function() {
                        var events = {
                            viewreset: this.update
                        };
                        return this._zoomAnimated && (events.zoomanim = this._animateZoom), events
                    },
                    getLatLng: function() {
                        return this._latlng
                    },
                    setLatLng: function(latlng) {
                        var oldLatLng = this._latlng;
                        return this._latlng = L.latLng(latlng), this.update(), this.fire("move", {
                            oldLatLng: oldLatLng,
                            latlng: this._latlng
                        })
                    },
                    setZIndexOffset: function(offset) {
                        return this.options.zIndexOffset = offset, this.update()
                    },
                    setIcon: function(icon) {
                        return this.options.icon = icon, this._map && (this._initIcon(), this.update()), this._popup && this.bindPopup(this._popup, this._popup.options), this
                    },
                    update: function() {
                        if (this._icon) {
                            var pos = this._map.latLngToLayerPoint(this._latlng).round();
                            this._setPos(pos)
                        }
                        return this
                    },
                    _initIcon: function() {
                        var options = this.options,
                            classToAdd = "leaflet-zoom-" + (this._zoomAnimated ? "animated" : "hide"),
                            icon = options.icon.createIcon(this._icon),
                            addIcon = !1;
                        icon !== this._icon && (this._icon && this._removeIcon(), addIcon = !0, options.title && (icon.title = options.title), options.alt && (icon.alt = options.alt)), L.DomUtil.addClass(icon, classToAdd), options.keyboard && (icon.tabIndex = "0"), this._icon = icon, this._initInteraction(), L.DomEvent && options.riseOnHover && L.DomEvent.on(icon, {
                            mouseover: this._bringToFront,
                            mouseout: this._resetZIndex
                        }, this);
                        var newShadow = options.icon.createShadow(this._shadow),
                            addShadow = !1;
                        newShadow !== this._shadow && (this._removeShadow(), addShadow = !0), newShadow && L.DomUtil.addClass(newShadow, classToAdd), this._shadow = newShadow, options.opacity < 1 && this._updateOpacity(), addIcon && this.getPane().appendChild(this._icon), newShadow && addShadow && this.getPane("shadowPane").appendChild(this._shadow)
                    },
                    _removeIcon: function() {
                        L.DomEvent && this.options.riseOnHover && L.DomEvent.off(this._icon, {
                            mouseover: this._bringToFront,
                            mouseout: this._resetZIndex
                        }, this), L.DomUtil.remove(this._icon), this._icon = null
                    },
                    _removeShadow: function() {
                        this._shadow && L.DomUtil.remove(this._shadow), this._shadow = null
                    },
                    _setPos: function(pos) {
                        L.DomUtil.setPosition(this._icon, pos), this._shadow && L.DomUtil.setPosition(this._shadow, pos), this._zIndex = pos.y + this.options.zIndexOffset, this._resetZIndex()
                    },
                    _updateZIndex: function(offset) {
                        this._icon.style.zIndex = this._zIndex + offset
                    },
                    _animateZoom: function(opt) {
                        var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();
                        this._setPos(pos)
                    },
                    _initInteraction: function() {
                        if (this.options.interactive && (L.DomUtil.addClass(this._icon, "leaflet-interactive"), L.DomEvent && L.DomEvent.on(this._icon, "click dblclick mousedown mouseup mouseover mousemove mouseout contextmenu keypress", this._fireMouseEvent, this), L.Handler.MarkerDrag)) {
                            var draggable = this.options.draggable;
                            this.dragging && (draggable = this.dragging.enabled(), this.dragging.disable()), this.dragging = new L.Handler.MarkerDrag(this), draggable && this.dragging.enable()
                        }
                    },
                    _fireMouseEvent: function(e, type) {
                        "mousedown" === e.type && L.DomEvent.preventDefault(e), "keypress" === e.type && 13 === e.keyCode && (type = "click"), this._map && this._map._fireMouseEvent(this, e, type, !0, this._latlng)
                    },
                    setOpacity: function(opacity) {
                        return this.options.opacity = opacity, this._map && this._updateOpacity(), this
                    },
                    _updateOpacity: function() {
                        var opacity = this.options.opacity;
                        L.DomUtil.setOpacity(this._icon, opacity), this._shadow && L.DomUtil.setOpacity(this._shadow, opacity)
                    },
                    _bringToFront: function() {
                        this._updateZIndex(this.options.riseOffset)
                    },
                    _resetZIndex: function() {
                        this._updateZIndex(0)
                    }
                }), L.marker = function(latlng, options) {
                    return new L.Marker(latlng, options)
                }, L.DivIcon = L.Icon.extend({
                    options: {
                        iconSize: [12, 12],
                        className: "leaflet-div-icon",
                        html: !1
                    },
                    createIcon: function(oldIcon) {
                        var div = oldIcon && "DIV" === oldIcon.tagName ? oldIcon : document.createElement("div"),
                            options = this.options;
                        return div.innerHTML = options.html !== !1 ? options.html : "", options.bgPos && (div.style.backgroundPosition = -options.bgPos.x + "px " + -options.bgPos.y + "px"), this._setIconStyles(div, "icon"), div
                    },
                    createShadow: function() {
                        return null
                    }
                }), L.divIcon = function(options) {
                    return new L.DivIcon(options)
                }, L.Map.mergeOptions({
                    closePopupOnClick: !0
                }), L.Popup = L.Layer.extend({
                    options: {
                        pane: "popupPane",
                        minWidth: 50,
                        maxWidth: 300,
                        offset: [0, 7],
                        autoPan: !0,
                        autoPanPadding: [5, 5],
                        closeButton: !0,
                        autoClose: !0,
                        zoomAnimation: !0
                    },
                    initialize: function(options, source) {
                        L.setOptions(this, options), this._source = source
                    },
                    onAdd: function(map) {
                        this._zoomAnimated = this._zoomAnimated && this.options.zoomAnimation, this._container || this._initLayout(), map._fadeAnimated && L.DomUtil.setOpacity(this._container, 0), clearTimeout(this._removeTimeout), this.getPane().appendChild(this._container), this.update(), map._fadeAnimated && L.DomUtil.setOpacity(this._container, 1), map.fire("popupopen", {
                            popup: this
                        }), this._source && this._source.fire("popupopen", {
                            popup: this
                        }, !0)
                    },
                    openOn: function(map) {
                        return map.openPopup(this), this
                    },
                    onRemove: function(map) {
                        map._fadeAnimated ? (L.DomUtil.setOpacity(this._container, 0), this._removeTimeout = setTimeout(L.bind(L.DomUtil.remove, L.DomUtil, this._container), 200)) : L.DomUtil.remove(this._container), map.fire("popupclose", {
                            popup: this
                        }), this._source && this._source.fire("popupclose", {
                            popup: this
                        }, !0)
                    },
                    getLatLng: function() {
                        return this._latlng
                    },
                    setLatLng: function(latlng) {
                        return this._latlng = L.latLng(latlng), this._map && (this._updatePosition(), this._adjustPan()), this
                    },
                    getContent: function() {
                        return this._content
                    },
                    setContent: function(content) {
                        return this._content = content, this.update(), this
                    },
                    update: function() {
                        this._map && (this._container.style.visibility = "hidden", this._updateContent(), this._updateLayout(), this._updatePosition(), this._container.style.visibility = "", this._adjustPan())
                    },
                    getEvents: function() {
                        var events = {
                                viewreset: this._updatePosition
                            },
                            options = this.options;
                        return this._zoomAnimated && (events.zoomanim = this._animateZoom), ("closeOnClick" in options ? options.closeOnClick : this._map.options.closePopupOnClick) && (events.preclick = this._close), options.keepInView && (events.moveend = this._adjustPan), events
                    },
                    isOpen: function() {
                        return !!this._map && this._map.hasLayer(this)
                    },
                    _close: function() {
                        this._map && this._map.closePopup(this)
                    },
                    _initLayout: function() {
                        var prefix = "leaflet-popup",
                            container = this._container = L.DomUtil.create("div", prefix + " " + (this.options.className || "") + " leaflet-zoom-" + (this._zoomAnimated ? "animated" : "hide"));
                        if (this.options.closeButton) {
                            var closeButton = this._closeButton = L.DomUtil.create("a", prefix + "-close-button", container);
                            closeButton.href = "#close", closeButton.innerHTML = "&#215;", L.DomEvent.on(closeButton, "click", this._onCloseButtonClick, this)
                        }
                        var wrapper = this._wrapper = L.DomUtil.create("div", prefix + "-content-wrapper", container);
                        this._contentNode = L.DomUtil.create("div", prefix + "-content", wrapper), L.DomEvent.disableClickPropagation(wrapper).disableScrollPropagation(this._contentNode).on(wrapper, "contextmenu", L.DomEvent.stopPropagation), this._tipContainer = L.DomUtil.create("div", prefix + "-tip-container", container), this._tip = L.DomUtil.create("div", prefix + "-tip", this._tipContainer)
                    },
                    _updateContent: function() {
                        if (this._content) {
                            var node = this._contentNode;
                            if ("string" == typeof this._content) node.innerHTML = this._content;
                            else {
                                for (; node.hasChildNodes();) node.removeChild(node.firstChild);
                                node.appendChild(this._content)
                            }
                            this.fire("contentupdate")
                        }
                    },
                    _updateLayout: function() {
                        var container = this._contentNode,
                            style = container.style;
                        style.width = "", style.whiteSpace = "nowrap";
                        var width = container.offsetWidth;
                        width = Math.min(width, this.options.maxWidth), width = Math.max(width, this.options.minWidth), style.width = width + 1 + "px", style.whiteSpace = "", style.height = "";
                        var height = container.offsetHeight,
                            maxHeight = this.options.maxHeight,
                            scrolledClass = "leaflet-popup-scrolled";
                        maxHeight && height > maxHeight ? (style.height = maxHeight + "px", L.DomUtil.addClass(container, scrolledClass)) : L.DomUtil.removeClass(container, scrolledClass), this._containerWidth = this._container.offsetWidth
                    },
                    _updatePosition: function() {
                        if (this._map) {
                            var pos = this._map.latLngToLayerPoint(this._latlng),
                                offset = L.point(this.options.offset);
                            this._zoomAnimated ? L.DomUtil.setPosition(this._container, pos) : offset = offset.add(pos);
                            var bottom = this._containerBottom = -offset.y,
                                left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;
                            this._container.style.bottom = bottom + "px", this._container.style.left = left + "px"
                        }
                    },
                    _animateZoom: function(e) {
                        var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
                        L.DomUtil.setPosition(this._container, pos)
                    },
                    _adjustPan: function() {
                        if (this.options.autoPan) {
                            var map = this._map,
                                containerHeight = this._container.offsetHeight,
                                containerWidth = this._containerWidth,
                                layerPos = new L.Point(this._containerLeft, -containerHeight - this._containerBottom);
                            this._zoomAnimated && layerPos._add(L.DomUtil.getPosition(this._container));
                            var containerPos = map.layerPointToContainerPoint(layerPos),
                                padding = L.point(this.options.autoPanPadding),
                                paddingTL = L.point(this.options.autoPanPaddingTopLeft || padding),
                                paddingBR = L.point(this.options.autoPanPaddingBottomRight || padding),
                                size = map.getSize(),
                                dx = 0,
                                dy = 0;
                            containerPos.x + containerWidth + paddingBR.x > size.x && (dx = containerPos.x + containerWidth - size.x + paddingBR.x), containerPos.x - dx - paddingTL.x < 0 && (dx = containerPos.x - paddingTL.x), containerPos.y + containerHeight + paddingBR.y > size.y && (dy = containerPos.y + containerHeight - size.y + paddingBR.y), containerPos.y - dy - paddingTL.y < 0 && (dy = containerPos.y - paddingTL.y), (dx || dy) && map.fire("autopanstart").panBy([dx, dy])
                        }
                    },
                    _onCloseButtonClick: function(e) {
                        this._close(), L.DomEvent.stop(e)
                    }
                }), L.popup = function(options, source) {
                    return new L.Popup(options, source)
                }, L.Map.include({
                    openPopup: function(popup, latlng, options) {
                        if (!(popup instanceof L.Popup)) {
                            var content = popup;
                            popup = new L.Popup(options).setContent(content)
                        }
                        return latlng && popup.setLatLng(latlng), this.hasLayer(popup) ? this : (this._popup && this._popup.options.autoClose && this.closePopup(), this._popup = popup, this.addLayer(popup))
                    },
                    closePopup: function(popup) {
                        return popup && popup !== this._popup || (popup = this._popup, this._popup = null), popup && this.removeLayer(popup), this
                    }
                }), L.Layer.include({
                    bindPopup: function(content, options) {
                        return content instanceof L.Popup ? (this._popup = content, content._source = this) : ((!this._popup || options) && (this._popup = new L.Popup(options, this)), this._popup.setContent(content)), this._popupHandlersAdded || (this.on({
                            click: this._openPopup,
                            remove: this.closePopup,
                            move: this._movePopup
                        }), this._popupHandlersAdded = !0), this
                    },
                    unbindPopup: function() {
                        return this._popup && (this.on({
                            click: this._openPopup,
                            remove: this.closePopup,
                            move: this._movePopup
                        }), this._popupHandlersAdded = !1, this._popup = null), this
                    },
                    openPopup: function(latlng) {
                        return this._popup && this._map && this._map.openPopup(this._popup, latlng || this._latlng || this.getCenter()), this
                    },
                    closePopup: function() {
                        return this._popup && this._popup._close(), this
                    },
                    togglePopup: function() {
                        return this._popup && (this._popup._map ? this.closePopup() : this.openPopup()), this
                    },
                    setPopupContent: function(content) {
                        return this._popup && this._popup.setContent(content), this
                    },
                    getPopup: function() {
                        return this._popup
                    },
                    _openPopup: function(e) {
                        this._map.openPopup(this._popup, e.latlng)
                    },
                    _movePopup: function(e) {
                        this._popup.setLatLng(e.latlng)
                    }
                }), L.Marker.include({
                    bindPopup: function(content, options) {
                        var anchor = L.point(this.options.icon.options.popupAnchor || [0, 0]).add(L.Popup.prototype.options.offset);
                        return options = L.extend({
                            offset: anchor
                        }, options), L.Layer.prototype.bindPopup.call(this, content, options)
                    },
                    _openPopup: L.Layer.prototype.togglePopup
                }), L.LayerGroup = L.Layer.extend({
                    initialize: function(layers) {
                        this._layers = {};
                        var i, len;
                        if (layers)
                            for (i = 0, len = layers.length; len > i; i++) this.addLayer(layers[i])
                    },
                    addLayer: function(layer) {
                        var id = this.getLayerId(layer);
                        return this._layers[id] = layer, this._map && this._map.addLayer(layer), this
                    },
                    removeLayer: function(layer) {
                        var id = layer in this._layers ? layer : this.getLayerId(layer);
                        return this._map && this._layers[id] && this._map.removeLayer(this._layers[id]), delete this._layers[id], this
                    },
                    hasLayer: function(layer) {
                        return !!layer && (layer in this._layers || this.getLayerId(layer) in this._layers)
                    },
                    clearLayers: function() {
                        for (var i in this._layers) this.removeLayer(this._layers[i]);
                        return this
                    },
                    invoke: function(methodName) {
                        var i, layer, args = Array.prototype.slice.call(arguments, 1);
                        for (i in this._layers) layer = this._layers[i], layer[methodName] && layer[methodName].apply(layer, args);
                        return this
                    },
                    onAdd: function(map) {
                        for (var i in this._layers) map.addLayer(this._layers[i])
                    },
                    onRemove: function(map) {
                        for (var i in this._layers) map.removeLayer(this._layers[i])
                    },
                    eachLayer: function(method, context) {
                        for (var i in this._layers) method.call(context, this._layers[i]);
                        return this
                    },
                    getLayer: function(id) {
                        return this._layers[id]
                    },
                    getLayers: function() {
                        var layers = [];
                        for (var i in this._layers) layers.push(this._layers[i]);
                        return layers
                    },
                    setZIndex: function(zIndex) {
                        return this.invoke("setZIndex", zIndex)
                    },
                    getLayerId: function(layer) {
                        return L.stamp(layer)
                    }
                }), L.layerGroup = function(layers) {
                    return new L.LayerGroup(layers)
                }, L.FeatureGroup = L.LayerGroup.extend({
                    addLayer: function(layer) {
                        return this.hasLayer(layer) ? this : (layer.addEventParent(this), L.LayerGroup.prototype.addLayer.call(this, layer), this._popupContent && layer.bindPopup && layer.bindPopup(this._popupContent, this._popupOptions), this.fire("layeradd", {
                            layer: layer
                        }))
                    },
                    removeLayer: function(layer) {
                        return this.hasLayer(layer) ? (layer in this._layers && (layer = this._layers[layer]), layer.removeEventParent(this), L.LayerGroup.prototype.removeLayer.call(this, layer), this._popupContent && this.invoke("unbindPopup"), this.fire("layerremove", {
                            layer: layer
                        })) : this
                    },
                    bindPopup: function(content, options) {
                        return this._popupContent = content, this._popupOptions = options, this.invoke("bindPopup", content, options)
                    },
                    openPopup: function(latlng) {
                        for (var id in this._layers) {
                            this._layers[id].openPopup(latlng);
                            break
                        }
                        return this
                    },
                    setStyle: function(style) {
                        return this.invoke("setStyle", style)
                    },
                    bringToFront: function() {
                        return this.invoke("bringToFront")
                    },
                    bringToBack: function() {
                        return this.invoke("bringToBack")
                    },
                    getBounds: function() {
                        var bounds = new L.LatLngBounds;
                        return this.eachLayer(function(layer) {
                            bounds.extend(layer.getBounds ? layer.getBounds() : layer.getLatLng())
                        }), bounds
                    }
                }), L.featureGroup = function(layers) {
                    return new L.FeatureGroup(layers)
                }, L.Renderer = L.Layer.extend({
                    options: {
                        padding: 0
                    },
                    initialize: function(options) {
                        L.setOptions(this, options), L.stamp(this)
                    },
                    onAdd: function() {
                        this._container || (this._initContainer(), this._zoomAnimated && L.DomUtil.addClass(this._container, "leaflet-zoom-animated")), this.getPane().appendChild(this._container), this._update()
                    },
                    onRemove: function() {
                        L.DomUtil.remove(this._container)
                    },
                    getEvents: function() {
                        var events = {
                            moveend: this._update
                        };
                        return this._zoomAnimated && (events.zoomanim = this._animateZoom), events
                    },
                    _animateZoom: function(e) {
                        var origin = e.origin.subtract(this._map._getCenterLayerPoint()),
                            offset = this._bounds.min.add(origin.multiplyBy(1 - e.scale)).add(e.offset).round();
                        L.DomUtil.setTransform(this._container, offset, e.scale)
                    },
                    _update: function() {
                        var p = this.options.padding,
                            size = this._map.getSize(),
                            min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();
                        this._bounds = new L.Bounds(min, min.add(size.multiplyBy(1 + 2 * p)).round())
                    }
                }), L.Map.include({
                    getRenderer: function(layer) {
                        var renderer = layer.options.renderer || this.options.renderer || this._renderer;
                        return renderer || (renderer = this._renderer = L.SVG && L.svg() || L.Canvas && L.canvas()), this.hasLayer(renderer) || this.addLayer(renderer), renderer
                    }
                }), L.Path = L.Layer.extend({
                    options: {
                        stroke: !0,
                        color: "#3388ff",
                        weight: 3,
                        opacity: 1,
                        lineCap: "round",
                        lineJoin: "round",
                        fillOpacity: .2,
                        fillRule: "evenodd",
                        interactive: !0
                    },
                    onAdd: function() {
                        this._renderer = this._map.getRenderer(this), this._renderer._initPath(this), this._project(), this._update(), this._renderer._addPath(this)
                    },
                    onRemove: function() {
                        this._renderer._removePath(this)
                    },
                    getEvents: function() {
                        return {
                            viewreset: this._project,
                            moveend: this._update
                        }
                    },
                    redraw: function() {
                        return this._map && this._renderer._updatePath(this), this
                    },
                    setStyle: function(style) {
                        return L.setOptions(this, style), this._renderer && this._renderer._updateStyle(this), this
                    },
                    bringToFront: function() {
                        return this._renderer && this._renderer._bringToFront(this), this
                    },
                    bringToBack: function() {
                        return this._renderer && this._renderer._bringToBack(this), this
                    },
                    _fireMouseEvent: function(e, type) {
                        this._map._fireMouseEvent(this, e, type, !0)
                    },
                    _clickTolerance: function() {
                        return (this.options.stroke ? this.options.weight / 2 : 0) + (L.Browser.touch ? 10 : 0)
                    }
                }), L.LineUtil = {
                    simplify: function(points, tolerance) {
                        if (!tolerance || !points.length) return points.slice();
                        var sqTolerance = tolerance * tolerance;
                        return points = this._reducePoints(points, sqTolerance), points = this._simplifyDP(points, sqTolerance)
                    },
                    pointToSegmentDistance: function(p, p1, p2) {
                        return Math.sqrt(this._sqClosestPointOnSegment(p, p1, p2, !0))
                    },
                    closestPointOnSegment: function(p, p1, p2) {
                        return this._sqClosestPointOnSegment(p, p1, p2)
                    },
                    _simplifyDP: function(points, sqTolerance) {
                        var len = points.length,
                            ArrayConstructor = typeof Uint8Array != undefined + "" ? Uint8Array : Array,
                            markers = new ArrayConstructor(len);
                        markers[0] = markers[len - 1] = 1, this._simplifyDPStep(points, markers, sqTolerance, 0, len - 1);
                        var i, newPoints = [];
                        for (i = 0; len > i; i++) markers[i] && newPoints.push(points[i]);
                        return newPoints
                    },
                    _simplifyDPStep: function(points, markers, sqTolerance, first, last) {
                        var index, i, sqDist, maxSqDist = 0;
                        for (i = first + 1; last - 1 >= i; i++) sqDist = this._sqClosestPointOnSegment(points[i], points[first], points[last], !0), sqDist > maxSqDist && (index = i, maxSqDist = sqDist);
                        maxSqDist > sqTolerance && (markers[index] = 1, this._simplifyDPStep(points, markers, sqTolerance, first, index), this._simplifyDPStep(points, markers, sqTolerance, index, last))
                    },
                    _reducePoints: function(points, sqTolerance) {
                        for (var reducedPoints = [points[0]], i = 1, prev = 0, len = points.length; len > i; i++) this._sqDist(points[i], points[prev]) > sqTolerance && (reducedPoints.push(points[i]), prev = i);
                        return len - 1 > prev && reducedPoints.push(points[len - 1]), reducedPoints
                    },
                    clipSegment: function(a, b, bounds, useLastCode) {
                        var codeOut, p, newCode, codeA = useLastCode ? this._lastCode : this._getBitCode(a, bounds),
                            codeB = this._getBitCode(b, bounds);
                        for (this._lastCode = codeB;;) {
                            if (!(codeA | codeB)) return [a, b];
                            if (codeA & codeB) return !1;
                            codeOut = codeA || codeB, p = this._getEdgeIntersection(a, b, codeOut, bounds), newCode = this._getBitCode(p, bounds), codeOut === codeA ? (a = p, codeA = newCode) : (b = p, codeB = newCode)
                        }
                    },
                    _getEdgeIntersection: function(a, b, code, bounds) {
                        var x, y, dx = b.x - a.x,
                            dy = b.y - a.y,
                            min = bounds.min,
                            max = bounds.max;
                        return 8 & code ? (x = a.x + dx * (max.y - a.y) / dy, y = max.y) : 4 & code ? (x = a.x + dx * (min.y - a.y) / dy, y = min.y) : 2 & code ? (x = max.x, y = a.y + dy * (max.x - a.x) / dx) : 1 & code && (x = min.x, y = a.y + dy * (min.x - a.x) / dx), new L.Point(x, y, !0)
                    },
                    _getBitCode: function(p, bounds) {
                        var code = 0;
                        return p.x < bounds.min.x ? code |= 1 : p.x > bounds.max.x && (code |= 2), p.y < bounds.min.y ? code |= 4 : p.y > bounds.max.y && (code |= 8), code
                    },
                    _sqDist: function(p1, p2) {
                        var dx = p2.x - p1.x,
                            dy = p2.y - p1.y;
                        return dx * dx + dy * dy
                    },
                    _sqClosestPointOnSegment: function(p, p1, p2, sqDist) {
                        var t, x = p1.x,
                            y = p1.y,
                            dx = p2.x - x,
                            dy = p2.y - y,
                            dot = dx * dx + dy * dy;
                        return dot > 0 && (t = ((p.x - x) * dx + (p.y - y) * dy) / dot, t > 1 ? (x = p2.x, y = p2.y) : t > 0 && (x += dx * t, y += dy * t)), dx = p.x - x, dy = p.y - y, sqDist ? dx * dx + dy * dy : new L.Point(x, y)
                    }
                }, L.Polyline = L.Path.extend({
                    options: {
                        smoothFactor: 1
                    },
                    initialize: function(latlngs, options) {
                        L.setOptions(this, options), this._setLatLngs(latlngs)
                    },
                    getLatLngs: function() {
                        return this._latlngs
                    },
                    setLatLngs: function(latlngs) {
                        return this._setLatLngs(latlngs), this.redraw()
                    },
                    addLatLng: function(latlng) {
                        return latlng = L.latLng(latlng), this._latlngs.push(latlng), this._bounds.extend(latlng), this.redraw()
                    },
                    spliceLatLngs: function() {
                        var removed = [].splice.apply(this._latlngs, arguments);
                        return this._setLatLngs(this._latlngs), this.redraw(), removed
                    },
                    closestLayerPoint: function(p) {
                        for (var p1, p2, minDistance = 1 / 0, minPoint = null, closest = L.LineUtil._sqClosestPointOnSegment, j = 0, jLen = this._parts.length; jLen > j; j++)
                            for (var points = this._parts[j], i = 1, len = points.length; len > i; i++) {
                                p1 = points[i - 1], p2 = points[i];
                                var sqDist = closest(p, p1, p2, !0);
                                minDistance > sqDist && (minDistance = sqDist,
                                    minPoint = closest(p, p1, p2))
                            }
                        return minPoint && (minPoint.distance = Math.sqrt(minDistance)), minPoint
                    },
                    getCenter: function() {
                        var i, halfDist, segDist, dist, p1, p2, ratio, points = this._rings[0],
                            len = points.length;
                        for (i = 0, halfDist = 0; len - 1 > i; i++) halfDist += points[i].distanceTo(points[i + 1]) / 2;
                        for (i = 0, dist = 0; len - 1 > i; i++)
                            if (p1 = points[i], p2 = points[i + 1], segDist = p1.distanceTo(p2), dist += segDist, dist > halfDist) return ratio = (dist - halfDist) / segDist, this._map.layerPointToLatLng([p2.x - ratio * (p2.x - p1.x), p2.y - ratio * (p2.y - p1.y)])
                    },
                    getBounds: function() {
                        return this._bounds
                    },
                    _setLatLngs: function(latlngs) {
                        this._bounds = new L.LatLngBounds, this._latlngs = this._convertLatLngs(latlngs)
                    },
                    _convertLatLngs: function(latlngs) {
                        for (var result = [], flat = this._flat(latlngs), i = 0, len = latlngs.length; len > i; i++) flat ? (result[i] = L.latLng(latlngs[i]), this._bounds.extend(result[i])) : result[i] = this._convertLatLngs(latlngs[i]);
                        return result
                    },
                    _flat: function(latlngs) {
                        return !L.Util.isArray(latlngs[0]) || "object" != typeof latlngs[0][0]
                    },
                    _project: function() {
                        this._rings = [], this._projectLatlngs(this._latlngs, this._rings);
                        var w = this._clickTolerance(),
                            p = new L.Point(w, -w);
                        this._latlngs.length && (this._pxBounds = new L.Bounds(this._map.latLngToLayerPoint(this._bounds.getSouthWest())._subtract(p), this._map.latLngToLayerPoint(this._bounds.getNorthEast())._add(p)))
                    },
                    _projectLatlngs: function(latlngs, result) {
                        var i, ring, flat = latlngs[0] instanceof L.LatLng,
                            len = latlngs.length;
                        if (flat) {
                            for (ring = [], i = 0; len > i; i++) ring[i] = this._map.latLngToLayerPoint(latlngs[i]);
                            result.push(ring)
                        } else
                            for (i = 0; len > i; i++) this._projectLatlngs(latlngs[i], result)
                    },
                    _clipPoints: function() {
                        if (this.options.noClip) return void(this._parts = this._rings);
                        this._parts = [];
                        var i, j, k, len, len2, segment, points, parts = this._parts,
                            bounds = this._renderer._bounds;
                        for (i = 0, k = 0, len = this._rings.length; len > i; i++)
                            for (points = this._rings[i], j = 0, len2 = points.length; len2 - 1 > j; j++) segment = L.LineUtil.clipSegment(points[j], points[j + 1], bounds, j), segment && (parts[k] = parts[k] || [], parts[k].push(segment[0]), (segment[1] !== points[j + 1] || j === len2 - 2) && (parts[k].push(segment[1]), k++))
                    },
                    _simplifyPoints: function() {
                        for (var parts = this._parts, tolerance = this.options.smoothFactor, i = 0, len = parts.length; len > i; i++) parts[i] = L.LineUtil.simplify(parts[i], tolerance)
                    },
                    _update: function() {
                        this._map && (this._clipPoints(), this._simplifyPoints(), this._updatePath())
                    },
                    _updatePath: function() {
                        this._renderer._updatePoly(this)
                    }
                }), L.polyline = function(latlngs, options) {
                    return new L.Polyline(latlngs, options)
                }, L.PolyUtil = {}, L.PolyUtil.clipPolygon = function(points, bounds) {
                    var clippedPoints, i, j, k, a, b, len, edge, p, edges = [1, 4, 2, 8],
                        lu = L.LineUtil;
                    for (i = 0, len = points.length; len > i; i++) points[i]._code = lu._getBitCode(points[i], bounds);
                    for (k = 0; 4 > k; k++) {
                        for (edge = edges[k], clippedPoints = [], i = 0, len = points.length, j = len - 1; len > i; j = i++) a = points[i], b = points[j], a._code & edge ? b._code & edge || (p = lu._getEdgeIntersection(b, a, edge, bounds), p._code = lu._getBitCode(p, bounds), clippedPoints.push(p)) : (b._code & edge && (p = lu._getEdgeIntersection(b, a, edge, bounds), p._code = lu._getBitCode(p, bounds), clippedPoints.push(p)), clippedPoints.push(a));
                        points = clippedPoints
                    }
                    return points
                }, L.Polygon = L.Polyline.extend({
                    options: {
                        fill: !0
                    },
                    getCenter: function() {
                        var i, j, len, p1, p2, f, area, x, y, points = this._rings[0];
                        for (area = x = y = 0, i = 0, len = points.length, j = len - 1; len > i; j = i++) p1 = points[i], p2 = points[j], f = p1.y * p2.x - p2.y * p1.x, x += (p1.x + p2.x) * f, y += (p1.y + p2.y) * f, area += 3 * f;
                        return this._map.layerPointToLatLng([x / area, y / area])
                    },
                    _convertLatLngs: function(latlngs) {
                        var result = L.Polyline.prototype._convertLatLngs.call(this, latlngs),
                            len = result.length;
                        return len >= 2 && result[0] instanceof L.LatLng && result[0].equals(result[len - 1]) && result.pop(), result
                    },
                    _clipPoints: function() {
                        if (this.options.noClip) return void(this._parts = this._rings);
                        var bounds = this._renderer._bounds,
                            w = this.options.weight,
                            p = new L.Point(w, w);
                        bounds = new L.Bounds(bounds.min.subtract(p), bounds.max.add(p)), this._parts = [];
                        for (var clipped, i = 0, len = this._rings.length; len > i; i++) clipped = L.PolyUtil.clipPolygon(this._rings[i], bounds), clipped.length && this._parts.push(clipped)
                    },
                    _updatePath: function() {
                        this._renderer._updatePoly(this, !0)
                    }
                }), L.polygon = function(latlngs, options) {
                    return new L.Polygon(latlngs, options)
                }, L.Rectangle = L.Polygon.extend({
                    initialize: function(latLngBounds, options) {
                        L.Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options)
                    },
                    setBounds: function(latLngBounds) {
                        this.setLatLngs(this._boundsToLatLngs(latLngBounds))
                    },
                    _boundsToLatLngs: function(latLngBounds) {
                        return latLngBounds = L.latLngBounds(latLngBounds), [latLngBounds.getSouthWest(), latLngBounds.getNorthWest(), latLngBounds.getNorthEast(), latLngBounds.getSouthEast()]
                    }
                }), L.rectangle = function(latLngBounds, options) {
                    return new L.Rectangle(latLngBounds, options)
                }, L.CircleMarker = L.Path.extend({
                    options: {
                        fill: !0,
                        radius: 10
                    },
                    initialize: function(latlng, options) {
                        L.setOptions(this, options), this._latlng = L.latLng(latlng), this._radius = this.options.radius
                    },
                    setLatLng: function(latlng) {
                        return this._latlng = L.latLng(latlng), this.redraw(), this.fire("move", {
                            latlng: this._latlng
                        })
                    },
                    getLatLng: function() {
                        return this._latlng
                    },
                    setRadius: function(radius) {
                        return this.options.radius = this._radius = radius, this.redraw()
                    },
                    getRadius: function() {
                        return this._radius
                    },
                    setStyle: function(options) {
                        var radius = options && options.radius || this._radius;
                        return L.Path.prototype.setStyle.call(this, options), this.setRadius(radius), this
                    },
                    _project: function() {
                        this._point = this._map.latLngToLayerPoint(this._latlng), this._updateBounds()
                    },
                    _updateBounds: function() {
                        var r = this._radius,
                            r2 = this._radiusY || r,
                            w = this._clickTolerance(),
                            p = [r + w, r2 + w];
                        this._pxBounds = new L.Bounds(this._point.subtract(p), this._point.add(p))
                    },
                    _update: function() {
                        this._map && this._updatePath()
                    },
                    _updatePath: function() {
                        this._renderer._updateCircle(this)
                    },
                    _empty: function() {
                        return this._radius && !this._renderer._bounds.intersects(this._pxBounds)
                    }
                }), L.circleMarker = function(latlng, options) {
                    return new L.CircleMarker(latlng, options)
                }, L.Circle = L.CircleMarker.extend({
                    initialize: function(latlng, radius, options) {
                        L.setOptions(this, options), this._latlng = L.latLng(latlng), this._mRadius = radius
                    },
                    setRadius: function(radius) {
                        return this._mRadius = radius, this.redraw()
                    },
                    getRadius: function() {
                        return this._mRadius
                    },
                    getBounds: function() {
                        var half = [this._radius, this._radiusY];
                        return new L.LatLngBounds(this._map.layerPointToLatLng(this._point.subtract(half)), this._map.layerPointToLatLng(this._point.add(half)))
                    },
                    setStyle: L.Path.prototype.setStyle,
                    _project: function() {
                        var lng = this._latlng.lng,
                            lat = this._latlng.lat,
                            map = this._map,
                            crs = map.options.crs;
                        if (crs.distance === L.CRS.Earth.distance) {
                            var d = Math.PI / 180,
                                latR = this._mRadius / L.CRS.Earth.R / d,
                                top = map.project([lat + latR, lng]),
                                bottom = map.project([lat - latR, lng]),
                                p = top.add(bottom).divideBy(2),
                                lat2 = map.unproject(p).lat,
                                lngR = Math.acos((Math.cos(latR * d) - Math.sin(lat * d) * Math.sin(lat2 * d)) / (Math.cos(lat * d) * Math.cos(lat2 * d))) / d;
                            this._point = p.subtract(map.getPixelOrigin()), this._radius = isNaN(lngR) ? 0 : Math.max(Math.round(p.x - map.project([lat2, lng - lngR]).x), 1), this._radiusY = Math.max(Math.round(p.y - top.y), 1)
                        } else {
                            var latlng2 = crs.unproject(crs.project(this._latlng).subtract([this._mRadius, 0]));
                            this._point = map.latLngToLayerPoint(this._latlng), this._radius = this._point.x - map.latLngToLayerPoint(latlng2).x
                        }
                        this._updateBounds()
                    }
                }), L.circle = function(latlng, radius, options) {
                    return new L.Circle(latlng, radius, options)
                }, L.SVG = L.Renderer.extend({
                    _initContainer: function() {
                        this._container = L.SVG.create("svg"), this._paths = {}, this._initEvents(), this._container.setAttribute("pointer-events", "none")
                    },
                    _update: function() {
                        if (!this._map._animatingZoom || !this._bounds) {
                            L.Renderer.prototype._update.call(this);
                            var b = this._bounds,
                                size = b.getSize(),
                                container = this._container;
                            L.DomUtil.setPosition(container, b.min), this._svgSize && this._svgSize.equals(size) || (this._svgSize = size, container.setAttribute("width", size.x), container.setAttribute("height", size.y)), L.DomUtil.setPosition(container, b.min), container.setAttribute("viewBox", [b.min.x, b.min.y, size.x, size.y].join(" "))
                        }
                    },
                    _initPath: function(layer) {
                        var path = layer._path = L.SVG.create("path");
                        layer.options.className && L.DomUtil.addClass(path, layer.options.className), layer.options.interactive && L.DomUtil.addClass(path, "leaflet-interactive"), this._updateStyle(layer)
                    },
                    _addPath: function(layer) {
                        var path = layer._path;
                        this._container.appendChild(path), this._paths[L.stamp(path)] = layer
                    },
                    _removePath: function(layer) {
                        var path = layer._path;
                        L.DomUtil.remove(path), delete this._paths[L.stamp(path)]
                    },
                    _updatePath: function(layer) {
                        layer._project(), layer._update()
                    },
                    _updateStyle: function(layer) {
                        var path = layer._path,
                            options = layer.options;
                        path && (options.stroke ? (path.setAttribute("stroke", options.color), path.setAttribute("stroke-opacity", options.opacity), path.setAttribute("stroke-width", options.weight), path.setAttribute("stroke-linecap", options.lineCap), path.setAttribute("stroke-linejoin", options.lineJoin), options.dashArray ? path.setAttribute("stroke-dasharray", options.dashArray) : path.removeAttribute("stroke-dasharray"), options.dashOffset ? path.setAttribute("stroke-dashoffset", options.dashOffset) : path.removeAttribute("stroke-dashoffset")) : path.setAttribute("stroke", "none"), options.fill ? (path.setAttribute("fill", options.fillColor || options.color), path.setAttribute("fill-opacity", options.fillOpacity), path.setAttribute("fill-rule", options.fillRule || "evenodd")) : path.setAttribute("fill", "none"), path.setAttribute("pointer-events", options.pointerEvents || (options.interactive ? "visiblePainted" : "none")))
                    },
                    _updatePoly: function(layer, closed) {
                        this._setPath(layer, L.SVG.pointsToPath(layer._parts, closed))
                    },
                    _updateCircle: function(layer) {
                        var p = layer._point,
                            r = layer._radius,
                            r2 = layer._radiusY || r,
                            arc = "a" + r + "," + r2 + " 0 1,0 ",
                            d = layer._empty() ? "M0 0" : "M" + (p.x - r) + "," + p.y + arc + 2 * r + ",0 " + arc + 2 * -r + ",0 ";
                        this._setPath(layer, d)
                    },
                    _setPath: function(layer, path) {
                        layer._path.setAttribute("d", path)
                    },
                    _bringToFront: function(layer) {
                        L.DomUtil.toFront(layer._path)
                    },
                    _bringToBack: function(layer) {
                        L.DomUtil.toBack(layer._path)
                    },
                    _initEvents: function() {
                        L.DomEvent.on(this._container, "click dblclick mousedown mouseup mouseover mouseout mousemove contextmenu", this._fireMouseEvent, this)
                    },
                    _fireMouseEvent: function(e) {
                        var path = this._paths[L.stamp(e.target || e.srcElement)];
                        path && path._fireMouseEvent(e)
                    }
                }), L.extend(L.SVG, {
                    create: function(name) {
                        return document.createElementNS("http://www.w3.org/2000/svg", name)
                    },
                    pointsToPath: function(rings, closed) {
                        var i, j, len, len2, points, p, str = "";
                        for (i = 0, len = rings.length; len > i; i++) {
                            for (points = rings[i], j = 0, len2 = points.length; len2 > j; j++) p = points[j], str += (j ? "L" : "M") + p.x + " " + p.y;
                            str += closed ? L.Browser.svg ? "z" : "x" : ""
                        }
                        return str || "M0 0"
                    }
                }), L.Browser.svg = !(!document.createElementNS || !L.SVG.create("svg").createSVGRect), L.svg = function(options) {
                    return L.Browser.svg || L.Browser.vml ? new L.SVG(options) : null
                }, L.Browser.vml = !L.Browser.svg && function() {
                    try {
                        var div = document.createElement("div");
                        div.innerHTML = '<v:shape adj="1"/>';
                        var shape = div.firstChild;
                        return shape.style.behavior = "url(#default#VML)", shape && "object" == typeof shape.adj
                    } catch (e) {
                        return !1
                    }
                }(), L.SVG.include(L.Browser.vml ? {
                    _initContainer: function() {
                        this._container = L.DomUtil.create("div", "leaflet-vml-container"), this._paths = {}, this._initEvents()
                    },
                    _update: function() {
                        this._map._animatingZoom || L.Renderer.prototype._update.call(this)
                    },
                    _initPath: function(layer) {
                        var container = layer._container = L.SVG.create("shape");
                        L.DomUtil.addClass(container, "leaflet-vml-shape " + (this.options.className || "")), container.coordsize = "1 1", layer._path = L.SVG.create("path"), container.appendChild(layer._path), this._updateStyle(layer)
                    },
                    _addPath: function(layer) {
                        var container = layer._container;
                        this._container.appendChild(container), this._paths[L.stamp(container)] = layer
                    },
                    _removePath: function(layer) {
                        var container = layer._container;
                        L.DomUtil.remove(container), delete this._paths[L.stamp(container)]
                    },
                    _updateStyle: function(layer) {
                        var stroke = layer._stroke,
                            fill = layer._fill,
                            options = layer.options,
                            container = layer._container;
                        container.stroked = !!options.stroke, container.filled = !!options.fill, options.stroke ? (stroke || (stroke = layer._stroke = L.SVG.create("stroke"), container.appendChild(stroke)), stroke.weight = options.weight + "px", stroke.color = options.color, stroke.opacity = options.opacity, stroke.dashStyle = options.dashArray ? L.Util.isArray(options.dashArray) ? options.dashArray.join(" ") : options.dashArray.replace(/( *, *)/g, " ") : "", stroke.endcap = options.lineCap.replace("butt", "flat"), stroke.joinstyle = options.lineJoin) : stroke && (container.removeChild(stroke), layer._stroke = null), options.fill ? (fill || (fill = layer._fill = L.SVG.create("fill"), container.appendChild(fill)), fill.color = options.fillColor || options.color, fill.opacity = options.fillOpacity) : fill && (container.removeChild(fill), layer._fill = null)
                    },
                    _updateCircle: function(layer) {
                        var p = layer._point.round(),
                            r = Math.round(layer._radius),
                            r2 = Math.round(layer._radiusY || r);
                        this._setPath(layer, layer._empty() ? "M0 0" : "AL " + p.x + "," + p.y + " " + r + "," + r2 + " 0,23592600")
                    },
                    _setPath: function(layer, path) {
                        layer._path.v = path
                    },
                    _bringToFront: function(layer) {
                        L.DomUtil.toFront(layer._container)
                    },
                    _bringToBack: function(layer) {
                        L.DomUtil.toBack(layer._container)
                    }
                } : {}), L.Browser.vml && (L.SVG.create = function() {
                    try {
                        return document.namespaces.add("lvml", "urn:schemas-microsoft-com:vml"),
                            function(name) {
                                return document.createElement("<lvml:" + name + ' class="lvml">')
                            }
                    } catch (e) {
                        return function(name) {
                            return document.createElement("<" + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">')
                        }
                    }
                }()), L.Canvas = L.Renderer.extend({
                    onAdd: function() {
                        L.Renderer.prototype.onAdd.call(this), this._layers = this._layers || {}, this._draw()
                    },
                    _initContainer: function() {
                        var container = this._container = document.createElement("canvas");
                        L.DomEvent.on(container, "mousemove", this._onMouseMove, this).on(container, "click dblclick mousedown mouseup contextmenu", this._onClick, this), this._ctx = container.getContext("2d")
                    },
                    _update: function() {
                        if (!this._map._animatingZoom || !this._bounds) {
                            L.Renderer.prototype._update.call(this);
                            var b = this._bounds,
                                container = this._container,
                                size = b.getSize(),
                                m = L.Browser.retina ? 2 : 1;
                            L.DomUtil.setPosition(container, b.min), container.width = m * size.x, container.height = m * size.y, container.style.width = size.x + "px", container.style.height = size.y + "px", L.Browser.retina && this._ctx.scale(2, 2), this._ctx.translate(-b.min.x, -b.min.y)
                        }
                    },
                    _initPath: function(layer) {
                        this._layers[L.stamp(layer)] = layer
                    },
                    _addPath: L.Util.falseFn,
                    _removePath: function(layer) {
                        layer._removed = !0, this._requestRedraw(layer)
                    },
                    _updatePath: function(layer) {
                        this._redrawBounds = layer._pxBounds, this._draw(!0), layer._project(), layer._update(), this._draw(), this._redrawBounds = null
                    },
                    _updateStyle: function(layer) {
                        this._requestRedraw(layer)
                    },
                    _requestRedraw: function(layer) {
                        this._map && (this._redrawBounds = this._redrawBounds || new L.Bounds, this._redrawBounds.extend(layer._pxBounds.min).extend(layer._pxBounds.max), this._redrawRequest = this._redrawRequest || L.Util.requestAnimFrame(this._redraw, this))
                    },
                    _redraw: function() {
                        this._redrawRequest = null, this._draw(!0), this._draw(), this._redrawBounds = null
                    },
                    _draw: function(clear) {
                        this._clear = clear;
                        var layer;
                        for (var id in this._layers) layer = this._layers[id], (!this._redrawBounds || layer._pxBounds.intersects(this._redrawBounds)) && layer._updatePath(), clear && layer._removed && (delete layer._removed, delete this._layers[id])
                    },
                    _updatePoly: function(layer, closed) {
                        var i, j, len2, p, parts = layer._parts,
                            len = parts.length,
                            ctx = this._ctx;
                        if (len) {
                            for (ctx.beginPath(), i = 0; len > i; i++) {
                                for (j = 0, len2 = parts[i].length; len2 > j; j++) p = parts[i][j], ctx[j ? "lineTo" : "moveTo"](p.x, p.y);
                                closed && ctx.closePath()
                            }
                            this._fillStroke(ctx, layer)
                        }
                    },
                    _updateCircle: function(layer) {
                        if (!layer._empty()) {
                            var p = layer._point,
                                ctx = this._ctx,
                                r = layer._radius,
                                s = (layer._radiusY || r) / r;
                            1 !== s && (ctx.save(), ctx.scale(1, s)), ctx.beginPath(), ctx.arc(p.x, p.y / s, r, 0, 2 * Math.PI, !1), 1 !== s && ctx.restore(), this._fillStroke(ctx, layer)
                        }
                    },
                    _fillStroke: function(ctx, layer) {
                        var clear = this._clear,
                            options = layer.options;
                        ctx.globalCompositeOperation = clear ? "destination-out" : "source-over", options.fill && (ctx.globalAlpha = clear ? 1 : options.fillOpacity, ctx.fillStyle = options.fillColor || options.color, ctx.fill(options.fillRule || "evenodd")), options.stroke && (ctx.globalAlpha = clear ? 1 : options.opacity, layer._prevWeight = ctx.lineWidth = clear ? layer._prevWeight + 1 : options.weight, ctx.strokeStyle = options.color, ctx.lineCap = options.lineCap, ctx.lineJoin = options.lineJoin, ctx.stroke())
                    },
                    _onClick: function(e) {
                        var point = this._map.mouseEventToLayerPoint(e);
                        for (var id in this._layers) this._layers[id]._containsPoint(point) && this._layers[id]._fireMouseEvent(e)
                    },
                    _onMouseMove: function(e) {
                        if (this._map && !this._map._animatingZoom) {
                            var point = this._map.mouseEventToLayerPoint(e);
                            for (var id in this._layers) this._handleHover(this._layers[id], e, point)
                        }
                    },
                    _handleHover: function(layer, e, point) {
                        layer.options.interactive && (layer._containsPoint(point) ? (layer._mouseInside || (L.DomUtil.addClass(this._container, "leaflet-interactive"), layer._fireMouseEvent(e, "mouseover"), layer._mouseInside = !0), layer._fireMouseEvent(e)) : layer._mouseInside && (L.DomUtil.removeClass(this._container, "leaflet-interactive"), layer._fireMouseEvent(e, "mouseout"), layer._mouseInside = !1))
                    },
                    _bringToFront: L.Util.falseFn,
                    _bringToBack: L.Util.falseFn
                }), L.Browser.canvas = function() {
                    return !!document.createElement("canvas").getContext
                }(), L.canvas = function(options) {
                    return L.Browser.canvas ? new L.Canvas(options) : null
                }, L.Polyline.prototype._containsPoint = function(p, closed) {
                    var i, j, k, len, len2, part, w = this._clickTolerance();
                    if (!this._pxBounds.contains(p)) return !1;
                    for (i = 0, len = this._parts.length; len > i; i++)
                        for (part = this._parts[i], j = 0, len2 = part.length, k = len2 - 1; len2 > j; k = j++)
                            if ((closed || 0 !== j) && L.LineUtil.pointToSegmentDistance(p, part[k], part[j]) <= w) return !0;
                    return !1
                }, L.Polygon.prototype._containsPoint = function(p) {
                    var part, p1, p2, i, j, k, len, len2, inside = !1;
                    if (!this._pxBounds.contains(p)) return !1;
                    for (i = 0, len = this._parts.length; len > i; i++)
                        for (part = this._parts[i], j = 0, len2 = part.length, k = len2 - 1; len2 > j; k = j++) p1 = part[j], p2 = part[k], p1.y > p.y != p2.y > p.y && p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x && (inside = !inside);
                    return inside || L.Polyline.prototype._containsPoint.call(this, p, !0)
                }, L.CircleMarker.prototype._containsPoint = function(p) {
                    return p.distanceTo(this._point) <= this._radius + this._clickTolerance()
                }, L.GeoJSON = L.FeatureGroup.extend({
                    initialize: function(geojson, options) {
                        L.setOptions(this, options), this._layers = {}, geojson && this.addData(geojson)
                    },
                    addData: function(geojson) {
                        var i, len, feature, features = L.Util.isArray(geojson) ? geojson : geojson.features;
                        if (features) {
                            for (i = 0, len = features.length; len > i; i++) feature = features[i], (feature.geometries || feature.geometry || feature.features || feature.coordinates) && this.addData(feature);
                            return this
                        }
                        var options = this.options;
                        if (!options.filter || options.filter(geojson)) {
                            var layer = L.GeoJSON.geometryToLayer(geojson, options);
                            return layer.feature = L.GeoJSON.asFeature(geojson), layer.defaultOptions = layer.options, this.resetStyle(layer), options.onEachFeature && options.onEachFeature(geojson, layer), this.addLayer(layer)
                        }
                    },
                    resetStyle: function(layer) {
                        return layer.options = layer.defaultOptions, this._setLayerStyle(layer, this.options.style), this
                    },
                    setStyle: function(style) {
                        return this.eachLayer(function(layer) {
                            this._setLayerStyle(layer, style)
                        }, this)
                    },
                    _setLayerStyle: function(layer, style) {
                        "function" == typeof style && (style = style(layer.feature)), layer.setStyle && layer.setStyle(style)
                    }
                }), L.extend(L.GeoJSON, {
                    geometryToLayer: function(geojson, options) {
                        var latlng, latlngs, i, len, geometry = "Feature" === geojson.type ? geojson.geometry : geojson,
                            coords = geometry.coordinates,
                            layers = [],
                            pointToLayer = options && options.pointToLayer,
                            coordsToLatLng = options && options.coordsToLatLng || this.coordsToLatLng;
                        switch (geometry.type) {
                            case "Point":
                                return latlng = coordsToLatLng(coords), pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);
                            case "MultiPoint":
                                for (i = 0, len = coords.length; len > i; i++) latlng = coordsToLatLng(coords[i]), layers.push(pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng));
                                return new L.FeatureGroup(layers);
                            case "LineString":
                            case "MultiLineString":
                                return latlngs = this.coordsToLatLngs(coords, "LineString" === geometry.type ? 0 : 1, coordsToLatLng), new L.Polyline(latlngs, options);
                            case "Polygon":
                            case "MultiPolygon":
                                return latlngs = this.coordsToLatLngs(coords, "Polygon" === geometry.type ? 1 : 2, coordsToLatLng), new L.Polygon(latlngs, options);
                            case "GeometryCollection":
                                for (i = 0, len = geometry.geometries.length; len > i; i++) layers.push(this.geometryToLayer({
                                    geometry: geometry.geometries[i],
                                    type: "Feature",
                                    properties: geojson.properties
                                }, options));
                                return new L.FeatureGroup(layers);
                            default:
                                throw new Error("Invalid GeoJSON object.")
                        }
                    },
                    coordsToLatLng: function(coords) {
                        return new L.LatLng(coords[1], coords[0], coords[2])
                    },
                    coordsToLatLngs: function(coords, levelsDeep, coordsToLatLng) {
                        for (var latlng, latlngs = [], i = 0, len = coords.length; len > i; i++) latlng = levelsDeep ? this.coordsToLatLngs(coords[i], levelsDeep - 1, coordsToLatLng) : (coordsToLatLng || this.coordsToLatLng)(coords[i]), latlngs.push(latlng);
                        return latlngs
                    },
                    latLngToCoords: function(latlng) {
                        return latlng.alt !== undefined ? [latlng.lng, latlng.lat, latlng.alt] : [latlng.lng, latlng.lat]
                    },
                    latLngsToCoords: function(latlngs, levelsDeep, closed) {
                        for (var coords = [], i = 0, len = latlngs.length; len > i; i++) coords.push(levelsDeep ? L.GeoJSON.latLngsToCoords(latlngs[i], levelsDeep - 1, closed) : L.GeoJSON.latLngToCoords(latlngs[i]));
                        return !levelsDeep && closed && coords.push(coords[0]), coords
                    },
                    getFeature: function(layer, newGeometry) {
                        return layer.feature ? L.extend({}, layer.feature, {
                            geometry: newGeometry
                        }) : L.GeoJSON.asFeature(newGeometry)
                    },
                    asFeature: function(geoJSON) {
                        return "Feature" === geoJSON.type ? geoJSON : {
                            type: "Feature",
                            properties: {},
                            geometry: geoJSON
                        }
                    }
                });
            var PointToGeoJSON = {
                toGeoJSON: function() {
                    return L.GeoJSON.getFeature(this, {
                        type: "Point",
                        coordinates: L.GeoJSON.latLngToCoords(this.getLatLng())
                    })
                }
            };
            L.Marker.include(PointToGeoJSON), L.Circle.include(PointToGeoJSON), L.CircleMarker.include(PointToGeoJSON), L.Polyline.prototype.toGeoJSON = function() {
                var multi = !this._flat(this._latlngs),
                    coords = L.GeoJSON.latLngsToCoords(this._latlngs, multi ? 1 : 0);
                return L.GeoJSON.getFeature(this, {
                    type: (multi ? "Multi" : "") + "LineString",
                    coordinates: coords
                })
            }, L.Polygon.prototype.toGeoJSON = function() {
                var holes = !this._flat(this._latlngs),
                    multi = holes && !this._flat(this._latlngs[0]),
                    coords = L.GeoJSON.latLngsToCoords(this._latlngs, multi ? 2 : holes ? 1 : 0, !0);
                return holes || (coords = [coords]), L.GeoJSON.getFeature(this, {
                    type: (multi ? "Multi" : "") + "Polygon",
                    coordinates: coords
                })
            }, L.LayerGroup.include({
                toMultiPoint: function() {
                    var coords = [];
                    return this.eachLayer(function(layer) {
                        coords.push(layer.toGeoJSON().geometry.coordinates)
                    }), L.GeoJSON.getFeature(this, {
                        type: "MultiPoint",
                        coordinates: coords
                    })
                },
                toGeoJSON: function() {
                    var type = this.feature && this.feature.geometry && this.feature.geometry.type;
                    if ("MultiPoint" === type) return this.toMultiPoint();
                    var isGeometryCollection = "GeometryCollection" === type,
                        jsons = [];
                    return this.eachLayer(function(layer) {
                        if (layer.toGeoJSON) {
                            var json = layer.toGeoJSON();
                            jsons.push(isGeometryCollection ? json.geometry : L.GeoJSON.asFeature(json))
                        }
                    }), isGeometryCollection ? L.GeoJSON.getFeature(this, {
                        geometries: jsons,
                        type: "GeometryCollection"
                    }) : {
                        type: "FeatureCollection",
                        features: jsons
                    }
                }
            }), L.geoJson = function(geojson, options) {
                return new L.GeoJSON(geojson, options)
            };
            var eventsKey = "_leaflet_events";
            L.DomEvent = {
                on: function(obj, types, fn, context) {
                    if ("object" == typeof types)
                        for (var type in types) this._on(obj, type, types[type], fn);
                    else {
                        types = L.Util.splitWords(types);
                        for (var i = 0, len = types.length; len > i; i++) this._on(obj, types[i], fn, context)
                    }
                    return this
                },
                off: function(obj, types, fn, context) {
                    if ("object" == typeof types)
                        for (var type in types) this._off(obj, type, types[type], fn);
                    else {
                        types = L.Util.splitWords(types);
                        for (var i = 0, len = types.length; len > i; i++) this._off(obj, types[i], fn, context)
                    }
                    return this
                },
                _on: function(obj, type, fn, context) {
                    var id = type + L.stamp(fn) + (context ? "_" + L.stamp(context) : "");
                    if (obj[eventsKey] && obj[eventsKey][id]) return this;
                    var handler = function(e) {
                            return fn.call(context || obj, e || window.event)
                        },
                        originalHandler = handler;
                    return L.Browser.pointer && 0 === type.indexOf("touch") ? this.addPointerListener(obj, type, handler, id) : L.Browser.touch && "dblclick" === type && this.addDoubleTapListener ? this.addDoubleTapListener(obj, handler, id) : "addEventListener" in obj ? "mousewheel" === type ? (obj.addEventListener("DOMMouseScroll", handler, !1), obj.addEventListener(type, handler, !1)) : "mouseenter" === type || "mouseleave" === type ? (handler = function(e) {
                        return e = e || window.event, L.DomEvent._checkMouse(obj, e) ? originalHandler(e) : void 0
                    }, obj.addEventListener("mouseenter" === type ? "mouseover" : "mouseout", handler, !1)) : ("click" === type && L.Browser.android && (handler = function(e) {
                        return L.DomEvent._filterClick(e, originalHandler)
                    }), obj.addEventListener(type, handler, !1)) : "attachEvent" in obj && obj.attachEvent("on" + type, handler), obj[eventsKey] = obj[eventsKey] || {}, obj[eventsKey][id] = handler, this
                },
                _off: function(obj, type, fn, context) {
                    var id = type + L.stamp(fn) + (context ? "_" + L.stamp(context) : ""),
                        handler = obj[eventsKey] && obj[eventsKey][id];
                    return handler ? (L.Browser.pointer && 0 === type.indexOf("touch") ? this.removePointerListener(obj, type, id) : L.Browser.touch && "dblclick" === type && this.removeDoubleTapListener ? this.removeDoubleTapListener(obj, id) : "removeEventListener" in obj ? "mousewheel" === type ? (obj.removeEventListener("DOMMouseScroll", handler, !1), obj.removeEventListener(type, handler, !1)) : obj.removeEventListener("mouseenter" === type ? "mouseover" : "mouseleave" === type ? "mouseout" : type, handler, !1) : "detachEvent" in obj && obj.detachEvent("on" + type, handler), obj[eventsKey][id] = null, this) : this
                },
                stopPropagation: function(e) {
                    return e.stopPropagation ? e.stopPropagation() : e.cancelBubble = !0, L.DomEvent._skipped(e), this
                },
                disableScrollPropagation: function(el) {
                    return L.DomEvent.on(el, "mousewheel MozMousePixelScroll", L.DomEvent.stopPropagation)
                },
                disableClickPropagation: function(el) {
                    var stop = L.DomEvent.stopPropagation;
                    return L.DomEvent.on(el, L.Draggable.START.join(" "), stop), L.DomEvent.on(el, {
                        click: L.DomEvent._fakeStop,
                        dblclick: stop
                    })
                },
                preventDefault: function(e) {
                    return e.preventDefault ? e.preventDefault() : e.returnValue = !1, this
                },
                stop: function(e) {
                    return L.DomEvent.preventDefault(e).stopPropagation(e)
                },
                getMousePosition: function(e, container) {
                    if (!container) return new L.Point(e.clientX, e.clientY);
                    var rect = container.getBoundingClientRect();
                    return new L.Point(e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop)
                },
                getWheelDelta: function(e) {
                    var delta = 0;
                    return e.wheelDelta && (delta = e.wheelDelta / 120), e.detail && (delta = -e.detail / 3), delta
                },
                _skipEvents: {},
                _fakeStop: function(e) {
                    L.DomEvent._skipEvents[e.type] = !0
                },
                _skipped: function(e) {
                    var skipped = this._skipEvents[e.type];
                    return this._skipEvents[e.type] = !1, skipped
                },
                _checkMouse: function(el, e) {
                    var related = e.relatedTarget;
                    if (!related) return !0;
                    try {
                        for (; related && related !== el;) related = related.parentNode
                    } catch (err) {
                        return !1
                    }
                    return related !== el
                },
                _filterClick: function(e, handler) {
                    var timeStamp = e.timeStamp || e.originalEvent.timeStamp,
                        elapsed = L.DomEvent._lastClick && timeStamp - L.DomEvent._lastClick;
                    return elapsed && elapsed > 100 && 500 > elapsed || e.target._simulatedClick && !e._simulated ? void L.DomEvent.stop(e) : (L.DomEvent._lastClick = timeStamp, handler(e))
                }
            }, L.DomEvent.addListener = L.DomEvent.on, L.DomEvent.removeListener = L.DomEvent.off, L.Draggable = L.Evented.extend({
                statics: {
                    START: L.Browser.touch ? ["touchstart", "mousedown"] : ["mousedown"],
                    END: {
                        mousedown: "mouseup",
                        touchstart: "touchend",
                        pointerdown: "touchend",
                        MSPointerDown: "touchend"
                    },
                    MOVE: {
                        mousedown: "mousemove",
                        touchstart: "touchmove",
                        pointerdown: "touchmove",
                        MSPointerDown: "touchmove"
                    }
                },
                initialize: function(element, dragStartTarget) {
                    this._element = element, this._dragStartTarget = dragStartTarget || element
                },
                enable: function() {
                    this._enabled || (L.DomEvent.on(this._dragStartTarget, L.Draggable.START.join(" "), this._onDown, this), this._enabled = !0)
                },
                disable: function() {
                    this._enabled && (L.DomEvent.off(this._dragStartTarget, L.Draggable.START.join(" "), this._onDown, this), this._enabled = !1, this._moved = !1)
                },
                _onDown: function(e) {
                    if (this._moved = !1, !(e.shiftKey || 1 !== e.which && 1 !== e.button && !e.touches || (L.DomEvent.stopPropagation(e), L.DomUtil.hasClass(this._element, "leaflet-zoom-anim") || (L.DomUtil.disableImageDrag(), L.DomUtil.disableTextSelection(), this._moving)))) {
                        this.fire("down");
                        var first = e.touches ? e.touches[0] : e;
                        this._startPoint = new L.Point(first.clientX, first.clientY), this._startPos = this._newPos = L.DomUtil.getPosition(this._element), L.DomEvent.on(document, L.Draggable.MOVE[e.type], this._onMove, this).on(document, L.Draggable.END[e.type], this._onUp, this)
                    }
                },
                _onMove: function(e) {
                    if (e.touches && e.touches.length > 1) return void(this._moved = !0);
                    var first = e.touches && 1 === e.touches.length ? e.touches[0] : e,
                        newPoint = new L.Point(first.clientX, first.clientY),
                        offset = newPoint.subtract(this._startPoint);
                    (offset.x || offset.y) && (L.Browser.touch && Math.abs(offset.x) + Math.abs(offset.y) < 3 || (L.DomEvent.preventDefault(e), this._moved || (this.fire("dragstart"), this._moved = !0, this._startPos = L.DomUtil.getPosition(this._element).subtract(offset), L.DomUtil.addClass(document.body, "leaflet-dragging"), this._lastTarget = e.target || e.srcElement, L.DomUtil.addClass(this._lastTarget, "leaflet-drag-target")), this._newPos = this._startPos.add(offset), this._moving = !0, L.Util.cancelAnimFrame(this._animRequest), this._animRequest = L.Util.requestAnimFrame(this._updatePosition, this, !0, this._dragStartTarget)))
                },
                _updatePosition: function() {
                    this.fire("predrag"), L.DomUtil.setPosition(this._element, this._newPos), this.fire("drag")
                },
                _onUp: function() {
                    L.DomUtil.removeClass(document.body, "leaflet-dragging"), this._lastTarget && (L.DomUtil.removeClass(this._lastTarget, "leaflet-drag-target"), this._lastTarget = null);
                    for (var i in L.Draggable.MOVE) L.DomEvent.off(document, L.Draggable.MOVE[i], this._onMove, this).off(document, L.Draggable.END[i], this._onUp, this);
                    L.DomUtil.enableImageDrag(), L.DomUtil.enableTextSelection(), this._moved && this._moving && (L.Util.cancelAnimFrame(this._animRequest), this.fire("dragend", {
                        distance: this._newPos.distanceTo(this._startPos)
                    })), this._moving = !1
                }
            }), L.Handler = L.Class.extend({
                initialize: function(map) {
                    this._map = map
                },
                enable: function() {
                    this._enabled || (this._enabled = !0, this.addHooks())
                },
                disable: function() {
                    this._enabled && (this._enabled = !1, this.removeHooks())
                },
                enabled: function() {
                    return !!this._enabled
                }
            }), L.Map.mergeOptions({
                dragging: !0,
                inertia: !L.Browser.android23,
                inertiaDeceleration: 3400,
                inertiaMaxSpeed: 1 / 0,
                inertiaThreshold: L.Browser.touch ? 32 : 18,
                easeLinearity: .2,
                worldCopyJump: !1
            }), L.Map.Drag = L.Handler.extend({
                addHooks: function() {
                    if (!this._draggable) {
                        var map = this._map;
                        this._draggable = new L.Draggable(map._mapPane, map._container), this._draggable.on({
                            down: this._onDown,
                            dragstart: this._onDragStart,
                            drag: this._onDrag,
                            dragend: this._onDragEnd
                        }, this), map.options.worldCopyJump && (this._draggable.on("predrag", this._onPreDrag, this), map.on("viewreset", this._onViewReset, this), map.whenReady(this._onViewReset, this))
                    }
                    this._draggable.enable()
                },
                removeHooks: function() {
                    this._draggable.disable()
                },
                moved: function() {
                    return this._draggable && this._draggable._moved
                },
                _onDown: function() {
                    this._map.stop()
                },
                _onDragStart: function() {
                    var map = this._map;
                    map.fire("movestart").fire("dragstart"), map.options.inertia && (this._positions = [], this._times = [])
                },
                _onDrag: function() {
                    if (this._map.options.inertia) {
                        var time = this._lastTime = +new Date,
                            pos = this._lastPos = this._draggable._absPos || this._draggable._newPos;
                        this._positions.push(pos), this._times.push(time), time - this._times[0] > 100 && (this._positions.shift(), this._times.shift())
                    }
                    this._map.fire("move").fire("drag")
                },
                _onViewReset: function() {
                    var pxCenter = this._map.getSize().divideBy(2),
                        pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);
                    this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x, this._worldWidth = this._map.getPixelWorldBounds().getSize().x
                },
                _onPreDrag: function() {
                    var worldWidth = this._worldWidth,
                        halfWidth = Math.round(worldWidth / 2),
                        dx = this._initialWorldOffset,
                        x = this._draggable._newPos.x,
                        newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx,
                        newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx,
                        newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;
                    this._draggable._absPos = this._draggable._newPos.clone(), this._draggable._newPos.x = newX
                },
                _onDragEnd: function(e) {
                    var map = this._map,
                        options = map.options,
                        delay = +new Date - this._lastTime,
                        noInertia = !options.inertia || delay > options.inertiaThreshold || !this._positions[0];
                    if (map.fire("dragend", e), noInertia) map.fire("moveend");
                    else {
                        var direction = this._lastPos.subtract(this._positions[0]),
                            duration = (this._lastTime + delay - this._times[0]) / 1e3,
                            ease = options.easeLinearity,
                            speedVector = direction.multiplyBy(ease / duration),
                            speed = speedVector.distanceTo([0, 0]),
                            limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
                            limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),
                            decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease),
                            offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();
                        offset.x && offset.y ? (offset = map._limitOffset(offset, map.options.maxBounds), L.Util.requestAnimFrame(function() {
                            map.panBy(offset, {
                                duration: decelerationDuration,
                                easeLinearity: ease,
                                noMoveStart: !0,
                                animate: !0
                            })
                        })) : map.fire("moveend")
                    }
                }
            }), L.Map.addInitHook("addHandler", "dragging", L.Map.Drag), L.Map.mergeOptions({
                doubleClickZoom: !0
            }), L.Map.DoubleClickZoom = L.Handler.extend({
                addHooks: function() {
                    this._map.on("dblclick", this._onDoubleClick, this)
                },
                removeHooks: function() {
                    this._map.off("dblclick", this._onDoubleClick, this)
                },
                _onDoubleClick: function(e) {
                    var map = this._map,
                        oldZoom = map.getZoom(),
                        zoom = e.originalEvent.shiftKey ? Math.ceil(oldZoom) - 1 : Math.floor(oldZoom) + 1;
                    "center" === map.options.doubleClickZoom ? map.setZoom(zoom) : map.setZoomAround(e.containerPoint, zoom)
                }
            }), L.Map.addInitHook("addHandler", "doubleClickZoom", L.Map.DoubleClickZoom), L.Map.mergeOptions({
                scrollWheelZoom: !0,
                wheelDebounceTime: 40
            }), L.Map.ScrollWheelZoom = L.Handler.extend({
                addHooks: function() {
                    L.DomEvent.on(this._map._container, {
                        mousewheel: this._onWheelScroll,
                        MozMousePixelScroll: L.DomEvent.preventDefault
                    }, this), this._delta = 0
                },
                removeHooks: function() {
                    L.DomEvent.off(this._map._container, {
                        mousewheel: this._onWheelScroll,
                        MozMousePixelScroll: L.DomEvent.preventDefault
                    }, this)
                },
                _onWheelScroll: function(e) {
                    var delta = L.DomEvent.getWheelDelta(e),
                        debounce = this._map.options.wheelDebounceTime;
                    this._delta += delta, this._lastMousePos = this._map.mouseEventToContainerPoint(e), this._startTime || (this._startTime = +new Date);
                    var left = Math.max(debounce - (+new Date - this._startTime), 0);
                    clearTimeout(this._timer), this._timer = setTimeout(L.bind(this._performZoom, this), left), L.DomEvent.stop(e)
                },
                _performZoom: function() {
                    var map = this._map,
                        delta = this._delta,
                        zoom = map.getZoom();
                    map.stop(), delta = delta > 0 ? Math.ceil(delta) : Math.floor(delta), delta = Math.max(Math.min(delta, 4), -4), delta = map._limitZoom(zoom + delta) - zoom, this._delta = 0, this._startTime = null, delta && ("center" === map.options.scrollWheelZoom ? map.setZoom(zoom + delta) : map.setZoomAround(this._lastMousePos, zoom + delta))
                }
            }), L.Map.addInitHook("addHandler", "scrollWheelZoom", L.Map.ScrollWheelZoom), L.extend(L.DomEvent, {
                _touchstart: L.Browser.msPointer ? "MSPointerDown" : L.Browser.pointer ? "pointerdown" : "touchstart",
                _touchend: L.Browser.msPointer ? "MSPointerUp" : L.Browser.pointer ? "pointerup" : "touchend",
                addDoubleTapListener: function(obj, handler, id) {
                    function onTouchStart(e) {
                        var count;
                        if (count = L.Browser.pointer ? L.DomEvent._pointersCount : e.touches.length, !(count > 1)) {
                            var now = Date.now(),
                                delta = now - (last || now);
                            touch = e.touches ? e.touches[0] : e, doubleTap = delta > 0 && delay >= delta, last = now
                        }
                    }

                    function onTouchEnd() {
                        if (doubleTap) {
                            if (L.Browser.pointer) {
                                var prop, i, newTouch = {};
                                for (i in touch) prop = touch[i], newTouch[i] = prop && prop.bind ? prop.bind(touch) : prop;
                                touch = newTouch
                            }
                            touch.type = "dblclick", handler(touch), last = null
                        }
                    }
                    var last, touch, doubleTap = !1,
                        delay = 250,
                        pre = "_leaflet_",
                        touchstart = this._touchstart,
                        touchend = this._touchend;
                    return obj[pre + touchstart + id] = onTouchStart, obj[pre + touchend + id] = onTouchEnd, obj.addEventListener(touchstart, onTouchStart, !1), obj.addEventListener(touchend, onTouchEnd, !1), this
                },
                removeDoubleTapListener: function(obj, id) {
                    var pre = "_leaflet_",
                        touchend = obj[pre + this._touchend + id];
                    return obj.removeEventListener(this._touchstart, obj[pre + this._touchstart + id], !1), obj.removeEventListener(this._touchend, touchend, !1), this
                }
            }), L.extend(L.DomEvent, {
                POINTER_DOWN: L.Browser.msPointer ? "MSPointerDown" : "pointerdown",
                POINTER_MOVE: L.Browser.msPointer ? "MSPointerMove" : "pointermove",
                POINTER_UP: L.Browser.msPointer ? "MSPointerUp" : "pointerup",
                POINTER_CANCEL: L.Browser.msPointer ? "MSPointerCancel" : "pointercancel",
                _pointers: {},
                _pointersCount: 0,
                addPointerListener: function(obj, type, handler, id) {
                    return "touchstart" === type ? this._addPointerStart(obj, handler, id) : "touchmove" === type ? this._addPointerMove(obj, handler, id) : "touchend" === type && this._addPointerEnd(obj, handler, id), this
                },
                removePointerListener: function(obj, type, id) {
                    var handler = obj["_leaflet_" + type + id];
                    return "touchstart" === type ? obj.removeEventListener(this.POINTER_DOWN, handler, !1) : "touchmove" === type ? obj.removeEventListener(this.POINTER_MOVE, handler, !1) : "touchend" === type && (obj.removeEventListener(this.POINTER_UP, handler, !1), obj.removeEventListener(this.POINTER_CANCEL, handler, !1)), this
                },
                _addPointerStart: function(obj, handler, id) {
                    var onDown = L.bind(function(e) {
                        L.DomEvent.preventDefault(e), this._handlePointer(e, handler)
                    }, this);
                    if (obj["_leaflet_touchstart" + id] = onDown, obj.addEventListener(this.POINTER_DOWN, onDown, !1), !this._pointerDocListener) {
                        var pointerUp = L.bind(this._globalPointerUp, this);
                        document.documentElement.addEventListener(this.POINTER_DOWN, L.bind(this._globalPointerDown, this), !0), document.documentElement.addEventListener(this.POINTER_MOVE, L.bind(this._globalPointerMove, this), !0), document.documentElement.addEventListener(this.POINTER_UP, pointerUp, !0), document.documentElement.addEventListener(this.POINTER_CANCEL, pointerUp, !0), this._pointerDocListener = !0
                    }
                },
                _globalPointerDown: function(e) {
                    this._pointers[e.pointerId] = e, this._pointersCount++
                },
                _globalPointerMove: function(e) {
                    this._pointers[e.pointerId] && (this._pointers[e.pointerId] = e)
                },
                _globalPointerUp: function(e) {
                    delete this._pointers[e.pointerId], this._pointersCount--
                },
                _handlePointer: function(e, handler) {
                    e.touches = [];
                    for (var i in this._pointers) e.touches.push(this._pointers[i]);
                    e.changedTouches = [e], handler(e)
                },
                _addPointerMove: function(obj, handler, id) {
                    var onMove = L.bind(function(e) {
                        (e.pointerType !== e.MSPOINTER_TYPE_MOUSE && "mouse" !== e.pointerType || 0 !== e.buttons) && this._handlePointer(e, handler)
                    }, this);
                    obj["_leaflet_touchmove" + id] = onMove, obj.addEventListener(this.POINTER_MOVE, onMove, !1)
                },
                _addPointerEnd: function(obj, handler, id) {
                    var onUp = L.bind(function(e) {
                        this._handlePointer(e, handler)
                    }, this);
                    obj["_leaflet_touchend" + id] = onUp, obj.addEventListener(this.POINTER_UP, onUp, !1), obj.addEventListener(this.POINTER_CANCEL, onUp, !1)
                }
            }), L.Map.mergeOptions({
                touchZoom: L.Browser.touch && !L.Browser.android23,
                bounceAtZoomLimits: !0
            }), L.Map.TouchZoom = L.Handler.extend({
                addHooks: function() {
                    L.DomEvent.on(this._map._container, "touchstart", this._onTouchStart, this)
                },
                removeHooks: function() {
                    L.DomEvent.off(this._map._container, "touchstart", this._onTouchStart, this)
                },
                _onTouchStart: function(e) {
                    var map = this._map;
                    if (e.touches && 2 === e.touches.length && !map._animatingZoom && !this._zooming) {
                        var p1 = map.mouseEventToLayerPoint(e.touches[0]),
                            p2 = map.mouseEventToLayerPoint(e.touches[1]),
                            viewCenter = map._getCenterLayerPoint();
                        this._startCenter = p1.add(p2)._divideBy(2), this._startDist = p1.distanceTo(p2), this._moved = !1, this._zooming = !0, this._centerOffset = viewCenter.subtract(this._startCenter), map.stop(), L.DomEvent.on(document, "touchmove", this._onTouchMove, this).on(document, "touchend", this._onTouchEnd, this), L.DomEvent.preventDefault(e)
                    }
                },
                _onTouchMove: function(e) {
                    if (e.touches && 2 === e.touches.length && this._zooming) {
                        var map = this._map,
                            p1 = map.mouseEventToLayerPoint(e.touches[0]),
                            p2 = map.mouseEventToLayerPoint(e.touches[1]);
                        if (this._scale = p1.distanceTo(p2) / this._startDist, this._delta = p1._add(p2)._divideBy(2)._subtract(this._startCenter), !map.options.bounceAtZoomLimits) {
                            var currentZoom = map.getScaleZoom(this._scale);
                            if (currentZoom <= map.getMinZoom() && this._scale < 1 || currentZoom >= map.getMaxZoom() && this._scale > 1) return
                        }
                        this._moved || (map.fire("movestart").fire("zoomstart"), this._moved = !0), L.Util.cancelAnimFrame(this._animRequest), this._animRequest = L.Util.requestAnimFrame(this._updateOnMove, this, !0, this._map._container), L.DomEvent.preventDefault(e)
                    }
                },
                _updateOnMove: function() {
                    var map = this._map;
                    this._center = "center" === map.options.touchZoom ? map.getCenter() : map.layerPointToLatLng(this._getTargetCenter()), this._zoom = map.getScaleZoom(this._scale), map._animateZoom(this._center, this._zoom)
                },
                _onTouchEnd: function() {
                    if (!this._moved || !this._zooming) return void(this._zooming = !1);
                    this._zooming = !1, L.Util.cancelAnimFrame(this._animRequest), L.DomEvent.off(document, "touchmove", this._onTouchMove).off(document, "touchend", this._onTouchEnd);
                    var map = this._map,
                        oldZoom = map.getZoom(),
                        zoomDelta = this._zoom - oldZoom,
                        finalZoom = map._limitZoom(zoomDelta > 0 ? Math.ceil(this._zoom) : Math.floor(this._zoom));
                    map._animateZoom(this._center, finalZoom, !0)
                },
                _getTargetCenter: function() {
                    var centerOffset = this._centerOffset.subtract(this._delta).divideBy(this._scale);
                    return this._startCenter.add(centerOffset)
                }
            }), L.Map.addInitHook("addHandler", "touchZoom", L.Map.TouchZoom), L.Map.mergeOptions({
                tap: !0,
                tapTolerance: 15
            }), L.Map.Tap = L.Handler.extend({
                addHooks: function() {
                    L.DomEvent.on(this._map._container, "touchstart", this._onDown, this)
                },
                removeHooks: function() {
                    L.DomEvent.off(this._map._container, "touchstart", this._onDown, this)
                },
                _onDown: function(e) {
                    if (e.touches) {
                        if (L.DomEvent.preventDefault(e), this._fireClick = !0, e.touches.length > 1) return this._fireClick = !1, void clearTimeout(this._holdTimeout);
                        var first = e.touches[0],
                            el = first.target;
                        this._startPos = this._newPos = new L.Point(first.clientX, first.clientY), el.tagName && "a" === el.tagName.toLowerCase() && L.DomUtil.addClass(el, "leaflet-active"), this._holdTimeout = setTimeout(L.bind(function() {
                            this._isTapValid() && (this._fireClick = !1, this._onUp(), this._simulateEvent("contextmenu", first))
                        }, this), 1e3), this._simulateEvent("mousedown", first), L.DomEvent.on(document, {
                            touchmove: this._onMove,
                            touchend: this._onUp
                        }, this)
                    }
                },
                _onUp: function(e) {
                    if (clearTimeout(this._holdTimeout), L.DomEvent.off(document, {
                            touchmove: this._onMove,
                            touchend: this._onUp
                        }, this), this._fireClick && e && e.changedTouches) {
                        var first = e.changedTouches[0],
                            el = first.target;
                        el && el.tagName && "a" === el.tagName.toLowerCase() && L.DomUtil.removeClass(el, "leaflet-active"), this._simulateEvent("mouseup", first), this._isTapValid() && this._simulateEvent("click", first)
                    }
                },
                _isTapValid: function() {
                    return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance
                },
                _onMove: function(e) {
                    var first = e.touches[0];
                    this._newPos = new L.Point(first.clientX, first.clientY)
                },
                _simulateEvent: function(type, e) {
                    var simulatedEvent = document.createEvent("MouseEvents");
                    simulatedEvent._simulated = !0, e.target._simulatedClick = !0, simulatedEvent.initMouseEvent(type, !0, !0, window, 1, e.screenX, e.screenY, e.clientX, e.clientY, !1, !1, !1, !1, 0, null), e.target.dispatchEvent(simulatedEvent)
                }
            }), L.Browser.touch && !L.Browser.pointer && L.Map.addInitHook("addHandler", "tap", L.Map.Tap), L.Map.mergeOptions({
                boxZoom: !0
            }), L.Map.BoxZoom = L.Handler.extend({
                initialize: function(map) {
                    this._map = map, this._container = map._container, this._pane = map._panes.overlayPane
                },
                addHooks: function() {
                    L.DomEvent.on(this._container, "mousedown", this._onMouseDown, this)
                },
                removeHooks: function() {
                    L.DomEvent.off(this._container, "mousedown", this._onMouseDown, this)
                },
                moved: function() {
                    return this._moved
                },
                _onMouseDown: function(e) {
                    return !e.shiftKey || 1 !== e.which && 1 !== e.button ? !1 : (this._moved = !1, L.DomUtil.disableTextSelection(), L.DomUtil.disableImageDrag(), this._startPoint = this._map.mouseEventToContainerPoint(e), void L.DomEvent.on(document, {
                        contextmenu: L.DomEvent.stop,
                        mousemove: this._onMouseMove,
                        mouseup: this._onMouseUp,
                        keydown: this._onKeyDown
                    }, this))
                },
                _onMouseMove: function(e) {
                    this._moved || (this._moved = !0, this._box = L.DomUtil.create("div", "leaflet-zoom-box", this._container), L.DomUtil.addClass(this._container, "leaflet-crosshair"), this._map.fire("boxzoomstart")), this._point = this._map.mouseEventToContainerPoint(e);
                    var bounds = new L.Bounds(this._point, this._startPoint),
                        size = bounds.getSize();
                    L.DomUtil.setPosition(this._box, bounds.min), this._box.style.width = size.x + "px", this._box.style.height = size.y + "px"
                },
                _finish: function() {
                    this._moved && (L.DomUtil.remove(this._box), L.DomUtil.removeClass(this._container, "leaflet-crosshair")), L.DomUtil.enableTextSelection(), L.DomUtil.enableImageDrag(), L.DomEvent.off(document, {
                        contextmenu: L.DomEvent.stop,
                        mousemove: this._onMouseMove,
                        mouseup: this._onMouseUp,
                        keydown: this._onKeyDown
                    }, this)
                },
                _onMouseUp: function(e) {
                    if (1 !== e.which && 1 !== e.button) return !1;
                    if (this._finish(), this._moved) {
                        var bounds = new L.LatLngBounds(this._map.containerPointToLatLng(this._startPoint), this._map.containerPointToLatLng(this._point));
                        this._map.fitBounds(bounds).fire("boxzoomend", {
                            boxZoomBounds: bounds
                        })
                    }
                },
                _onKeyDown: function(e) {
                    27 === e.keyCode && this._finish()
                }
            }), L.Map.addInitHook("addHandler", "boxZoom", L.Map.BoxZoom), L.Map.mergeOptions({
                keyboard: !0,
                keyboardPanOffset: 80,
                keyboardZoomOffset: 1
            }), L.Map.Keyboard = L.Handler.extend({
                keyCodes: {
                    left: [37],
                    right: [39],
                    down: [40],
                    up: [38],
                    zoomIn: [187, 107, 61, 171],
                    zoomOut: [189, 109, 173]
                },
                initialize: function(map) {
                    this._map = map, this._setPanOffset(map.options.keyboardPanOffset), this._setZoomOffset(map.options.keyboardZoomOffset)
                },
                addHooks: function() {
                    var container = this._map._container; - 1 === container.tabIndex && (container.tabIndex = "0"), L.DomEvent.on(container, {
                        focus: this._onFocus,
                        blur: this._onBlur,
                        mousedown: this._onMouseDown
                    }, this), this._map.on({
                        focus: this._addHooks,
                        blur: this._removeHooks
                    }, this)
                },
                removeHooks: function() {
                    this._removeHooks(), L.DomEvent.off(this._map._container, {
                        focus: this._onFocus,
                        blur: this._onBlur,
                        mousedown: this._onMouseDown
                    }, this), this._map.off({
                        focus: this._addHooks,
                        blur: this._removeHooks
                    }, this)
                },
                _onMouseDown: function() {
                    if (!this._focused) {
                        var body = document.body,
                            docEl = document.documentElement,
                            top = body.scrollTop || docEl.scrollTop,
                            left = body.scrollLeft || docEl.scrollLeft;
                        this._map._container.focus(), window.scrollTo(left, top)
                    }
                },
                _onFocus: function() {
                    this._focused = !0, this._map.fire("focus")
                },
                _onBlur: function() {
                    this._focused = !1, this._map.fire("blur")
                },
                _setPanOffset: function(pan) {
                    var i, len, keys = this._panKeys = {},
                        codes = this.keyCodes;
                    for (i = 0, len = codes.left.length; len > i; i++) keys[codes.left[i]] = [-1 * pan, 0];
                    for (i = 0, len = codes.right.length; len > i; i++) keys[codes.right[i]] = [pan, 0];
                    for (i = 0, len = codes.down.length; len > i; i++) keys[codes.down[i]] = [0, pan];
                    for (i = 0, len = codes.up.length; len > i; i++) keys[codes.up[i]] = [0, -1 * pan]
                },
                _setZoomOffset: function(zoom) {
                    var i, len, keys = this._zoomKeys = {},
                        codes = this.keyCodes;
                    for (i = 0, len = codes.zoomIn.length; len > i; i++) keys[codes.zoomIn[i]] = zoom;
                    for (i = 0, len = codes.zoomOut.length; len > i; i++) keys[codes.zoomOut[i]] = -zoom
                },
                _addHooks: function() {
                    L.DomEvent.on(document, "keydown", this._onKeyDown, this)
                },
                _removeHooks: function() {
                    L.DomEvent.off(document, "keydown", this._onKeyDown, this)
                },
                _onKeyDown: function(e) {
                    if (!(e.altKey || e.ctrlKey || e.metaKey)) {
                        var key = e.keyCode,
                            map = this._map;
                        if (key in this._panKeys) {
                            if (map._panAnim && map._panAnim._inProgress) return;
                            map.panBy(this._panKeys[key]), map.options.maxBounds && map.panInsideBounds(map.options.maxBounds)
                        } else if (key in this._zoomKeys) map.setZoom(map.getZoom() + (e.shiftKey ? 3 : 1) * this._zoomKeys[key]);
                        else {
                            if (27 !== key) return;
                            map.closePopup()
                        }
                        L.DomEvent.stop(e)
                    }
                }
            }), L.Map.addInitHook("addHandler", "keyboard", L.Map.Keyboard), L.Handler.MarkerDrag = L.Handler.extend({
                initialize: function(marker) {
                    this._marker = marker
                },
                addHooks: function() {
                    var icon = this._marker._icon;
                    this._draggable || (this._draggable = new L.Draggable(icon, icon)), this._draggable.on({
                        dragstart: this._onDragStart,
                        drag: this._onDrag,
                        dragend: this._onDragEnd
                    }, this).enable(), L.DomUtil.addClass(icon, "leaflet-marker-draggable")
                },
                removeHooks: function() {
                    this._draggable.off({
                        dragstart: this._onDragStart,
                        drag: this._onDrag,
                        dragend: this._onDragEnd
                    }, this).disable(), L.DomUtil.removeClass(this._marker._icon, "leaflet-marker-draggable")
                },
                moved: function() {
                    return this._draggable && this._draggable._moved
                },
                _onDragStart: function() {
                    this._marker.closePopup().fire("movestart").fire("dragstart")
                },
                _onDrag: function() {
                    var marker = this._marker,
                        shadow = marker._shadow,
                        iconPos = L.DomUtil.getPosition(marker._icon),
                        latlng = marker._map.layerPointToLatLng(iconPos);
                    shadow && L.DomUtil.setPosition(shadow, iconPos), marker._latlng = latlng, marker.fire("move", {
                        latlng: latlng
                    }).fire("drag")
                },
                _onDragEnd: function(e) {
                    this._marker.fire("moveend").fire("dragend", e)
                }
            }), L.Control = L.Class.extend({
                options: {
                    position: "topright"
                },
                initialize: function(options) {
                    L.setOptions(this, options)
                },
                getPosition: function() {
                    return this.options.position
                },
                setPosition: function(position) {
                    var map = this._map;
                    return map && map.removeControl(this), this.options.position = position, map && map.addControl(this), this
                },
                getContainer: function() {
                    return this._container
                },
                addTo: function(map) {
                    this.remove(), this._map = map;
                    var container = this._container = this.onAdd(map),
                        pos = this.getPosition(),
                        corner = map._controlCorners[pos];
                    return L.DomUtil.addClass(container, "leaflet-control"), -1 !== pos.indexOf("bottom") ? corner.insertBefore(container, corner.firstChild) : corner.appendChild(container), this
                },
                remove: function() {
                    return this._map ? (L.DomUtil.remove(this._container), this.onRemove && this.onRemove(this._map), this._map = null, this) : this
                },
                _refocusOnMap: function() {
                    this._map && this._map.getContainer().focus()
                }
            }), L.control = function(options) {
                return new L.Control(options)
            }, L.Map.include({
                addControl: function(control) {
                    return control.addTo(this), this
                },
                removeControl: function(control) {
                    return control.remove(), this
                },
                _initControlPos: function() {
                    function createCorner(vSide, hSide) {
                        var className = l + vSide + " " + l + hSide;
                        corners[vSide + hSide] = L.DomUtil.create("div", className, container)
                    }
                    var corners = this._controlCorners = {},
                        l = "leaflet-",
                        container = this._controlContainer = L.DomUtil.create("div", l + "control-container", this._container);
                    createCorner("top", "left"), createCorner("top", "right"), createCorner("bottom", "left"), createCorner("bottom", "right")
                },
                _clearControlPos: function() {
                    L.DomUtil.remove(this._controlContainer)
                }
            }), L.Control.Zoom = L.Control.extend({
                options: {
                    position: "topleft",
                    zoomInText: "+",
                    zoomInTitle: "Zoom in",
                    zoomOutText: "-",
                    zoomOutTitle: "Zoom out"
                },
                onAdd: function(map) {
                    var zoomName = "leaflet-control-zoom",
                        container = L.DomUtil.create("div", zoomName + " leaflet-bar"),
                        options = this.options;
                    return this._zoomInButton = this._createButton(options.zoomInText, options.zoomInTitle, zoomName + "-in", container, this._zoomIn), this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle, zoomName + "-out", container, this._zoomOut), this._updateDisabled(), map.on("zoomend zoomlevelschange", this._updateDisabled, this), container
                },
                onRemove: function(map) {
                    map.off("zoomend zoomlevelschange", this._updateDisabled, this)
                },
                _zoomIn: function(e) {
                    this._map.zoomIn(e.shiftKey ? 3 : 1)
                },
                _zoomOut: function(e) {
                    this._map.zoomOut(e.shiftKey ? 3 : 1)
                },
                _createButton: function(html, title, className, container, fn) {
                    var link = L.DomUtil.create("a", className, container);
                    return link.innerHTML = html, link.href = "#", link.title = title, L.DomEvent.on(link, "mousedown dblclick", L.DomEvent.stopPropagation).on(link, "click", L.DomEvent.stop).on(link, "click", fn, this).on(link, "click", this._refocusOnMap, this), link
                },
                _updateDisabled: function() {
                    var map = this._map,
                        className = "leaflet-disabled";
                    L.DomUtil.removeClass(this._zoomInButton, className), L.DomUtil.removeClass(this._zoomOutButton, className), map._zoom === map.getMinZoom() && L.DomUtil.addClass(this._zoomOutButton, className), map._zoom === map.getMaxZoom() && L.DomUtil.addClass(this._zoomInButton, className)
                }
            }), L.Map.mergeOptions({
                zoomControl: !0
            }), L.Map.addInitHook(function() {
                this.options.zoomControl && (this.zoomControl = new L.Control.Zoom, this.addControl(this.zoomControl))
            }), L.control.zoom = function(options) {
                return new L.Control.Zoom(options)
            }, L.Control.Attribution = L.Control.extend({
                options: {
                    position: "bottomright",
                    prefix: '<a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
                },
                initialize: function(options) {
                    L.setOptions(this, options), this._attributions = {}
                },
                onAdd: function(map) {
                    this._container = L.DomUtil.create("div", "leaflet-control-attribution"), L.DomEvent && L.DomEvent.disableClickPropagation(this._container);
                    for (var i in map._layers) map._layers[i].getAttribution && this.addAttribution(map._layers[i].getAttribution());
                    return this._update(), this._container
                },
                setPrefix: function(prefix) {
                    return this.options.prefix = prefix, this._update(), this
                },
                addAttribution: function(text) {
                    return text ? (this._attributions[text] || (this._attributions[text] = 0), this._attributions[text]++, this._update(), this) : void 0
                },
                removeAttribution: function(text) {
                    return text ? (this._attributions[text] && (this._attributions[text]--, this._update()), this) : void 0
                },
                _update: function() {
                    if (this._map) {
                        var attribs = [];
                        for (var i in this._attributions) this._attributions[i] && attribs.push(i);
                        var prefixAndAttribs = [];
                        this.options.prefix && prefixAndAttribs.push(this.options.prefix), attribs.length && prefixAndAttribs.push(attribs.join(", ")), this._container.innerHTML = prefixAndAttribs.join(" | ")
                    }
                }
            }), L.Map.mergeOptions({
                attributionControl: !0
            }), L.Map.addInitHook(function() {
                this.options.attributionControl && (this.attributionControl = (new L.Control.Attribution).addTo(this))
            }), L.control.attribution = function(options) {
                return new L.Control.Attribution(options)
            }, L.Control.Scale = L.Control.extend({
                options: {
                    position: "bottomleft",
                    maxWidth: 100,
                    metric: !0,
                    imperial: !0
                },
                onAdd: function(map) {
                    var className = "leaflet-control-scale",
                        container = L.DomUtil.create("div", className),
                        options = this.options;
                    return this._addScales(options, className + "-line", container), map.on(options.updateWhenIdle ? "moveend" : "move", this._update, this), map.whenReady(this._update, this), container
                },
                onRemove: function(map) {
                    map.off(this.options.updateWhenIdle ? "moveend" : "move", this._update, this)
                },
                _addScales: function(options, className, container) {
                    options.metric && (this._mScale = L.DomUtil.create("div", className, container)), options.imperial && (this._iScale = L.DomUtil.create("div", className, container))
                },
                _update: function() {
                    var map = this._map,
                        y = map.getSize().y / 2,
                        maxMeters = L.CRS.Earth.distance(map.containerPointToLatLng([0, y]), map.containerPointToLatLng([this.options.maxWidth, y]));
                    this._updateScales(maxMeters)
                },
                _updateScales: function(maxMeters) {
                    this.options.metric && maxMeters && this._updateMetric(maxMeters), this.options.imperial && maxMeters && this._updateImperial(maxMeters)
                },
                _updateMetric: function(maxMeters) {
                    var meters = this._getRoundNum(maxMeters),
                        label = 1e3 > meters ? meters + " m" : meters / 1e3 + " km";
                    this._updateScale(this._mScale, label, meters / maxMeters)
                },
                _updateImperial: function(maxMeters) {
                    var maxMiles, miles, feet, maxFeet = 3.2808399 * maxMeters;
                    maxFeet > 5280 ? (maxMiles = maxFeet / 5280, miles = this._getRoundNum(maxMiles), this._updateScale(this._iScale, miles + " mi", miles / maxMiles)) : (feet = this._getRoundNum(maxFeet), this._updateScale(this._iScale, feet + " ft", feet / maxFeet))
                },
                _updateScale: function(scale, text, ratio) {
                    scale.style.width = Math.round(this.options.maxWidth * ratio) + "px", scale.innerHTML = text
                },
                _getRoundNum: function(num) {
                    var pow10 = Math.pow(10, (Math.floor(num) + "").length - 1),
                        d = num / pow10;
                    return d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1, pow10 * d
                }
            }), L.control.scale = function(options) {
                return new L.Control.Scale(options)
            }, L.Control.Layers = L.Control.extend({
                options: {
                    collapsed: !0,
                    position: "topright",
                    autoZIndex: !0
                },
                initialize: function(baseLayers, overlays, options) {
                    L.setOptions(this, options), this._layers = {}, this._lastZIndex = 0, this._handlingClick = !1;
                    for (var i in baseLayers) this._addLayer(baseLayers[i], i);
                    for (i in overlays) this._addLayer(overlays[i], i, !0)
                },
                onAdd: function() {
                    return this._initLayout(), this._update(), this._container
                },
                addBaseLayer: function(layer, name) {
                    return this._addLayer(layer, name), this._update()
                },
                addOverlay: function(layer, name) {
                    return this._addLayer(layer, name, !0), this._update()
                },
                removeLayer: function(layer) {
                    return layer.off("add remove", this._onLayerChange, this), delete this._layers[L.stamp(layer)], this._update()
                },
                _initLayout: function() {
                    var className = "leaflet-control-layers",
                        container = this._container = L.DomUtil.create("div", className);
                    container.setAttribute("aria-haspopup", !0), L.Browser.touch ? L.DomEvent.on(container, "click", L.DomEvent.stopPropagation) : L.DomEvent.disableClickPropagation(container).disableScrollPropagation(container);
                    var form = this._form = L.DomUtil.create("form", className + "-list");
                    if (this.options.collapsed) {
                        L.Browser.android || L.DomEvent.on(container, {
                            mouseenter: this._expand,
                            mouseleave: this._collapse
                        }, this);
                        var link = this._layersLink = L.DomUtil.create("a", className + "-toggle", container);
                        link.href = "#", link.title = "Layers", L.Browser.touch ? L.DomEvent.on(link, "click", L.DomEvent.stop).on(link, "click", this._expand, this) : L.DomEvent.on(link, "focus", this._expand, this), L.DomEvent.on(form, "click", function() {
                            setTimeout(L.bind(this._onInputClick, this), 0)
                        }, this), this._map.on("click", this._collapse, this)
                    } else this._expand();
                    this._baseLayersList = L.DomUtil.create("div", className + "-base", form), this._separator = L.DomUtil.create("div", className + "-separator", form), this._overlaysList = L.DomUtil.create("div", className + "-overlays", form), container.appendChild(form)
                },
                _addLayer: function(layer, name, overlay) {
                    layer.on("add remove", this._onLayerChange, this);
                    var id = L.stamp(layer);
                    this._layers[id] = {
                        layer: layer,
                        name: name,
                        overlay: overlay
                    }, this.options.autoZIndex && layer.setZIndex && (this._lastZIndex++, layer.setZIndex(this._lastZIndex))
                },
                _update: function() {
                    if (this._container) {
                        L.DomUtil.empty(this._baseLayersList), L.DomUtil.empty(this._overlaysList);
                        var baseLayersPresent, overlaysPresent, i, obj;
                        for (i in this._layers) obj = this._layers[i], this._addItem(obj), overlaysPresent = overlaysPresent || obj.overlay, baseLayersPresent = baseLayersPresent || !obj.overlay;
                        return this._separator.style.display = overlaysPresent && baseLayersPresent ? "" : "none", this
                    }
                },
                _onLayerChange: function(e) {
                    this._handlingClick || this._update();
                    var overlay = this._layers[L.stamp(e.target)].overlay,
                        type = overlay ? "add" === e.type ? "overlayadd" : "overlayremove" : "add" === e.type ? "baselayerchange" : null;
                    type && this._map.fire(type, e.target)
                },
                _createRadioElement: function(name, checked) {
                    var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"' + (checked ? ' checked="checked"' : "") + "/>",
                        radioFragment = document.createElement("div");
                    return radioFragment.innerHTML = radioHtml, radioFragment.firstChild
                },
                _addItem: function(obj) {
                    var input, label = document.createElement("label"),
                        checked = this._map.hasLayer(obj.layer);
                    obj.overlay ? (input = document.createElement("input"), input.type = "checkbox", input.className = "leaflet-control-layers-selector", input.defaultChecked = checked) : input = this._createRadioElement("leaflet-base-layers", checked), input.layerId = L.stamp(obj.layer), L.DomEvent.on(input, "click", this._onInputClick, this);
                    var name = document.createElement("span");
                    name.innerHTML = " " + obj.name, label.appendChild(input), label.appendChild(name);
                    var container = obj.overlay ? this._overlaysList : this._baseLayersList;
                    return container.appendChild(label), label
                },
                _onInputClick: function() {
                    var input, layer, hasLayer, inputs = this._form.getElementsByTagName("input"),
                        addedLayers = [],
                        removedLayers = [];
                    this._handlingClick = !0;
                    for (var i = 0, len = inputs.length; len > i; i++) input = inputs[i], layer = this._layers[input.layerId].layer, hasLayer = this._map.hasLayer(layer), input.checked && !hasLayer ? addedLayers.push(layer) : !input.checked && hasLayer && removedLayers.push(layer);
                    for (i = 0; i < removedLayers.length; i++) this._map.removeLayer(removedLayers[i]);
                    for (i = 0; i < addedLayers.length; i++) this._map.addLayer(addedLayers[i]);
                    this._handlingClick = !1, this._refocusOnMap()
                },
                _expand: function() {
                    L.DomUtil.addClass(this._container, "leaflet-control-layers-expanded")
                },
                _collapse: function() {
                    L.DomUtil.removeClass(this._container, "leaflet-control-layers-expanded")
                }
            }), L.control.layers = function(baseLayers, overlays, options) {
                return new L.Control.Layers(baseLayers, overlays, options)
            }, L.PosAnimation = L.Evented.extend({
                run: function(el, newPos, duration, easeLinearity) {
                    this.stop(), this._el = el, this._inProgress = !0, this._duration = duration || .25, this._easeOutPower = 1 / Math.max(easeLinearity || .5, .2), this._startPos = L.DomUtil.getPosition(el), this._offset = newPos.subtract(this._startPos), this._startTime = +new Date, this.fire("start"), this._animate()
                },
                stop: function() {
                    this._inProgress && (this._step(!0), this._complete())
                },
                _animate: function() {
                    this._animId = L.Util.requestAnimFrame(this._animate, this), this._step()
                },
                _step: function(round) {
                    var elapsed = +new Date - this._startTime,
                        duration = 1e3 * this._duration;
                    duration > elapsed ? this._runFrame(this._easeOut(elapsed / duration), round) : (this._runFrame(1), this._complete())
                },
                _runFrame: function(progress, round) {
                    var pos = this._startPos.add(this._offset.multiplyBy(progress));
                    round && pos._round(), L.DomUtil.setPosition(this._el, pos), this.fire("step")
                },
                _complete: function() {
                    L.Util.cancelAnimFrame(this._animId), this._inProgress = !1, this.fire("end")
                },
                _easeOut: function(t) {
                    return 1 - Math.pow(1 - t, this._easeOutPower)
                }
            }), L.Map.include({
                setView: function(center, zoom, options) {
                    if (zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom), center = this._limitCenter(L.latLng(center), zoom, this.options.maxBounds), options = options || {}, this.stop(), this._loaded && !options.reset && options !== !0) {
                        options.animate !== undefined && (options.zoom = L.extend({
                            animate: options.animate
                        }, options.zoom), options.pan = L.extend({
                            animate: options.animate
                        }, options.pan));
                        var animated = this._zoom !== zoom ? this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) : this._tryAnimatedPan(center, options.pan);
                        if (animated) return clearTimeout(this._sizeTimer), this
                    }
                    return this._resetView(center, zoom), this
                },
                panBy: function(offset, options) {
                    if (offset = L.point(offset).round(), options = options || {}, !offset.x && !offset.y) return this;
                    if (options.animate !== !0 && !this.getSize().contains(offset)) return this._resetView(this.unproject(this.project(this.getCenter()).add(offset)), this.getZoom());
                    if (this._panAnim || (this._panAnim = new L.PosAnimation, this._panAnim.on({
                            step: this._onPanTransitionStep,
                            end: this._onPanTransitionEnd
                        }, this)), options.noMoveStart || this.fire("movestart"), options.animate !== !1) {
                        L.DomUtil.addClass(this._mapPane, "leaflet-pan-anim");
                        var newPos = this._getMapPanePos().subtract(offset);
                        this._panAnim.run(this._mapPane, newPos, options.duration || .25, options.easeLinearity)
                    } else this._rawPanBy(offset), this.fire("move").fire("moveend");
                    return this
                },
                _onPanTransitionStep: function() {
                    this.fire("move")
                },
                _onPanTransitionEnd: function() {
                    L.DomUtil.removeClass(this._mapPane, "leaflet-pan-anim"), this.fire("moveend")
                },
                _tryAnimatedPan: function(center, options) {
                    var offset = this._getCenterOffset(center)._floor();
                    return (options && options.animate) === !0 || this.getSize().contains(offset) ? (this.panBy(offset, options), !0) : !1
                }
            }), L.Map.mergeOptions({
                zoomAnimation: !0,
                zoomAnimationThreshold: 4
            });
            var zoomAnimated = L.DomUtil.TRANSITION && L.Browser.any3d && !L.Browser.mobileOpera;
            zoomAnimated && L.Map.addInitHook(function() {
                this._zoomAnimated = this.options.zoomAnimation, this._zoomAnimated && (this._createAnimProxy(), L.DomEvent.on(this._proxy, L.DomUtil.TRANSITION_END, this._catchTransitionEnd, this))
            }), L.Map.include(zoomAnimated ? {
                _createAnimProxy: function() {
                    var proxy = this._proxy = L.DomUtil.create("div", "leaflet-proxy leaflet-zoom-animated");
                    this._panes.mapPane.appendChild(proxy), this.on("zoomanim", function(e) {
                        L.DomUtil.setTransform(proxy, this.project(e.center, e.zoom), this.getZoomScale(e.zoom, 1))
                    }, this), this.on("load moveend", function() {
                        var c = this.getCenter(),
                            z = this.getZoom();
                        L.DomUtil.setTransform(proxy, this.project(c, z), this.getZoomScale(z, 1))
                    }, this)
                },
                _catchTransitionEnd: function(e) {
                    this._animatingZoom && e.propertyName.indexOf("transform") >= 0 && this._onZoomTransitionEnd()
                },
                _nothingToAnimate: function() {
                    return !this._container.getElementsByClassName("leaflet-zoom-animated").length
                },
                _tryAnimatedZoom: function(center, zoom, options) {
                    if (this._animatingZoom) return !0;
                    if (options = options || {}, !this._zoomAnimated || options.animate === !1 || this._nothingToAnimate() || Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) return !1;
                    var scale = this.getZoomScale(zoom),
                        offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale);
                    return options.animate === !0 || this.getSize().contains(offset) ? (L.Util.requestAnimFrame(function() {
                        this.fire("movestart").fire("zoomstart")._animateZoom(center, zoom, !0)
                    }, this), !0) : !1
                },
                _animateZoom: function(center, zoom, startAnim) {
                    startAnim && (this._animatingZoom = !0, this._animateToCenter = center, this._animateToZoom = zoom, L.DomUtil.addClass(this._mapPane, "leaflet-zoom-anim")), this.fire("zoomanim", {
                        center: center,
                        zoom: zoom,
                        scale: this.getZoomScale(zoom),
                        origin: this.latLngToLayerPoint(center),
                        offset: this._getCenterOffset(center).multiplyBy(-1)
                    })
                },
                _onZoomTransitionEnd: function() {
                    this._animatingZoom = !1, L.DomUtil.removeClass(this._mapPane, "leaflet-zoom-anim"), this._resetView(this._animateToCenter, this._animateToZoom, !0, !0)
                }
            } : {}), L.Map.include({
                flyTo: function(targetCenter, targetZoom) {
                    function r(i) {
                        var b = (w1 * w1 - w0 * w0 + (i ? -1 : 1) * rho2 * rho2 * u1 * u1) / (2 * (i ? w1 : w0) * rho2 * u1);
                        return Math.log(Math.sqrt(b * b + 1) - b)
                    }

                    function sinh(n) {
                        return (Math.exp(n) - Math.exp(-n)) / 2
                    }

                    function cosh(n) {
                        return (Math.exp(n) + Math.exp(-n)) / 2
                    }

                    function tanh(n) {
                        return sinh(n) / cosh(n)
                    }

                    function w(s) {
                        return w0 * (cosh(r0) / cosh(r0 + rho * s))
                    }

                    function u(s) {
                        return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2
                    }

                    function easeOut(t) {
                        return 1 - Math.pow(1 - t, 1.5)
                    }

                    function frame() {
                        var t = (Date.now() - start) / duration,
                            s = easeOut(t) * S;
                        1 >= t ? (this._flyToFrame = L.Util.requestAnimFrame(frame, this), this._resetView(this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom), this.getScaleZoom(w0 / w(s), startZoom), !0, !0)) : this._resetView(targetCenter, targetZoom, !0, !0)
                    }
                    this.stop();
                    var from = this.project(this.getCenter()),
                        to = this.project(targetCenter),
                        size = this.getSize(),
                        startZoom = this._zoom;
                    targetZoom = targetZoom === undefined ? startZoom : targetZoom;
                    var w0 = Math.max(size.x, size.y),
                        w1 = w0 * this.getZoomScale(startZoom, targetZoom),
                        u1 = to.distanceTo(from),
                        rho = 1.42,
                        rho2 = rho * rho,
                        r0 = r(0),
                        start = Date.now(),
                        S = (r(1) - r0) / rho,
                        duration = 1e3 * S * .8;
                    this.fire("zoomstart"), frame.call(this)
                }
            }), L.Map.include({
                _defaultLocateOptions: {
                    timeout: 1e4,
                    watch: !1
                },
                locate: function(options) {
                    if (options = this._locateOptions = L.extend(this._defaultLocateOptions, options), !navigator.geolocation) return this._handleGeolocationError({
                        code: 0,
                        message: "Geolocation not supported."
                    }), this;
                    var onResponse = L.bind(this._handleGeolocationResponse, this),
                        onError = L.bind(this._handleGeolocationError, this);
                    return options.watch ? this._locationWatchId = navigator.geolocation.watchPosition(onResponse, onError, options) : navigator.geolocation.getCurrentPosition(onResponse, onError, options), this
                },
                stopLocate: function() {
                    return navigator.geolocation && navigator.geolocation.clearWatch(this._locationWatchId), this._locateOptions && (this._locateOptions.setView = !1), this
                },
                _handleGeolocationError: function(error) {
                    var c = error.code,
                        message = error.message || (1 === c ? "permission denied" : 2 === c ? "position unavailable" : "timeout");
                    this._locateOptions.setView && !this._loaded && this.fitWorld(), this.fire("locationerror", {
                        code: c,
                        message: "Geolocation error: " + message + "."
                    })
                },
                _handleGeolocationResponse: function(pos) {
                    var lat = pos.coords.latitude,
                        lng = pos.coords.longitude,
                        latlng = new L.LatLng(lat, lng),
                        bounds = latlng.toBounds(pos.coords.accuracy),
                        options = this._locateOptions;
                    if (options.setView) {
                        var zoom = this.getBoundsZoom(bounds);
                        this.setView(latlng, options.maxZoom ? Math.min(zoom, options.maxZoom) : zoom)
                    }
                    var data = {
                        latlng: latlng,
                        bounds: bounds,
                        timestamp: pos.timestamp
                    };
                    for (var i in pos.coords) "number" == typeof pos.coords[i] && (data[i] = pos.coords[i]);
                    this.fire("locationfound", data)
                }
            })
        }(window, document)
    }, {}],
    12: [function(require, module) {
        var L = require("../libraries/leaflet");
        module.exports = {}, L.LineUtil.PolylineDecorator = {
            computeAngle: function(a, b) {
                return 180 * Math.atan2(b.y - a.y, b.x - a.x) / Math.PI + 90
            },
            getPointPathPixelLength: function(pts) {
                var nbPts = pts.length;
                if (2 > nbPts) return 0;
                for (var pt, dist = 0, prevPt = pts[0], i = 1; nbPts > i; i++) dist += prevPt.distanceTo(pt = pts[i]), prevPt = pt;
                return dist
            },
            getPixelLength: function(pl, map) {
                var ll = pl instanceof L.Polyline ? pl.getLatLngs() : pl,
                    nbPts = ll.length;
                if (2 > nbPts) return 0;
                for (var pt, dist = 0, prevPt = map.project(ll[0]), i = 1; nbPts > i; i++) dist += prevPt.distanceTo(pt = map.project(ll[i])), prevPt = pt;
                return dist
            },
            projectPatternOnPath: function(path, offsetRatio, repeatRatio, map) {
                var i, pathAsPoints = [];
                for (i = 0, l = path.length; i < l; i++) pathAsPoints[i] = map.project(path[i]);
                var pattern = this.projectPatternOnPointPath(pathAsPoints, offsetRatio, repeatRatio);
                for (i = 0, l = pattern.length; i < l; i++) pattern[i].latLng = map.unproject(pattern[i].pt);
                return pattern
            },
            projectPatternOnPointPath: function(pts, offsetRatio, repeatRatio) {
                var positions = [],
                    repeatIntervalLength = this.getPointPathPixelLength(pts) * repeatRatio,
                    previous = this.interpolateOnPointPath(pts, offsetRatio);
                if (positions.push(previous), repeatRatio > 0) {
                    var remainingPath = pts;
                    remainingPath = remainingPath.slice(previous.predecessor), remainingPath[0] = previous.pt;
                    for (var remainingLength = this.getPointPathPixelLength(remainingPath); remainingLength >= repeatIntervalLength;) previous = this.interpolateOnPointPath(remainingPath, repeatIntervalLength / remainingLength), positions.push(previous), remainingPath = remainingPath.slice(previous.predecessor), remainingPath[0] = previous.pt, remainingLength = this.getPointPathPixelLength(remainingPath)
                }
                return positions
            },
            interpolateOnPointPath: function(pts, ratio) {
                var nbVertices = pts.length;
                if (2 > nbVertices) return null;
                if (0 >= ratio) return {
                    pt: pts[0],
                    predecessor: 0,
                    heading: this.computeAngle(pts[0], pts[1])
                };
                if (ratio >= 1) return {
                    pt: pts[nbVertices - 1],
                    predecessor: nbVertices - 1,
                    heading: this.computeAngle(pts[nbVertices - 2], pts[nbVertices - 1])
                };
                if (2 == nbVertices) return {
                    pt: this.interpolateBetweenPoints(pts[0], pts[1], ratio),
                    predecessor: 0,
                    heading: this.computeAngle(pts[0], pts[1])
                };
                for (var pathLength = this.getPointPathPixelLength(pts), a = pts[0], b = a, ratioA = 0, ratioB = 0, distB = 0, i = 1; nbVertices > i && ratio > ratioB; i++) a = b, ratioA = ratioB, b = pts[i], distB += a.distanceTo(b), ratioB = distB / pathLength;
                var segmentRatio = (ratio - ratioA) / (ratioB - ratioA);
                return {
                    pt: this.interpolateBetweenPoints(a, b, segmentRatio),
                    predecessor: i - 2,
                    heading: this.computeAngle(a, b)
                }
            },
            interpolateBetweenPoints: function(ptA, ptB, ratio) {
                return ptB.x != ptA.x ? new L.Point(ptA.x * (1 - ratio) + ratio * ptB.x, ptA.y * (1 - ratio) + ratio * ptB.y) : new L.Point(ptA.x, ptA.y + (ptB.y - ptA.y) * ratio)
            }
        }, L.Symbol = L.Symbol || {}, L.Symbol.Arrow = L.Class.extend({
            isZoomDependant: !0,
            options: {
                polygon: !1,
                pixelSize: 10,
                headAngle: 60,
                pathOptions: {
                    stroke: !1,
                    weight: 2
                }
            },
            initialize: function(options) {
                L.Util.setOptions(this, options), this.options.pathOptions.clickable = !1
            },
            buildSymbol: function(dirPoint, latLngs, map) {
                var path, opts = this.options;
                return path = opts.polygon ? new L.Polygon(this._buildArrowPath(dirPoint, map), opts.pathOptions) : new L.Polyline(this._buildArrowPath(dirPoint, map), opts.pathOptions)
            },
            _buildArrowPath: function(dirPoint, map) {
                var d2r = Math.PI / 180,
                    tipPoint = map.project(dirPoint.latLng),
                    direction = -(dirPoint.heading - 90) * d2r,
                    radianArrowAngle = this.options.headAngle / 2 * d2r,
                    distance = 20,
                    xAdj = distance * Math.sin(direction),
                    yAdj = distance * Math.cos(direction),
                    headAngle1 = direction + radianArrowAngle,
                    headAngle2 = direction - radianArrowAngle,
                    arrowHead1 = new L.Point(tipPoint.x - this.options.pixelSize * Math.cos(headAngle1) + xAdj, tipPoint.y + this.options.pixelSize * Math.sin(headAngle1) + yAdj),
                    arrowHead2 = new L.Point(tipPoint.x - this.options.pixelSize * Math.cos(headAngle2) + xAdj, tipPoint.y + this.options.pixelSize * Math.sin(headAngle2) + yAdj),
                    newTipPoint = new L.Point(tipPoint.x + xAdj, tipPoint.y + yAdj),
                    endOfArrow = new L.Point(newTipPoint.x + 20 * Math.sin(direction - Math.PI / 2), newTipPoint.y + 20 * Math.cos(direction - Math.PI / 2));
                return [map.unproject(arrowHead1), map.unproject(newTipPoint), map.unproject(endOfArrow), map.unproject(newTipPoint), map.unproject(arrowHead2)]
            }
        }), L.Symbol.arrow = function(options) {
            return new L.Symbol.Arrow(options)
        }, L.PolylineDecorator = L.LayerGroup.extend({
            options: {
                patterns: []
            },
            initialize: function(paths, options) {
                L.LayerGroup.prototype.initialize.call(this), L.Util.setOptions(this, options), this._map = null, this._initPaths(paths), this._initPatterns()
            },
            _initPaths: function(p) {
                this._paths = [];
                if (p instanceof L.Polyline) this._initPath(p.getLatLngs(), p instanceof L.Polygon);
                else if (L.Util.isArray(p) && p.length > 0)
                    if (p[0] instanceof L.Polyline)
                        for (var i = 0; i < p.length; i++) this._initPath(p[i].getLatLngs(), p[i] instanceof L.Polygon);
                    else this._initPath(p)
            },
            _isCoordArray: function(ll) {
                return L.Util.isArray(ll) && ll.length > 0 && (ll[0] instanceof L.LatLng || L.Util.isArray(ll[0]) && 2 == ll[0].length && "number" == typeof ll[0][0])
            },
            _initPath: function(path, isPolygon) {
                var latLngs;
                latLngs = this._isCoordArray(path) ? [path] : path;
                for (var i = 0; i < latLngs.length; i++) isPolygon && latLngs[i].push(latLngs[i][0]), this._paths.push(latLngs[i])
            },
            _initPatterns: function() {
                this._isZoomDependant = !1, this._patterns = [];
                for (var pattern, i = 0; i < this.options.patterns.length; i++) pattern = this._parsePatternDef(this.options.patterns[i]), this._patterns.push(pattern), this._isZoomDependant = this._isZoomDependant || pattern.isOffsetInPixels || pattern.isRepeatInPixels || pattern.symbolFactory.isZoomDependant
            },
            setPatterns: function(patterns) {
                this.options.patterns = patterns, this._initPatterns(), this._softRedraw()
            },
            setPaths: function(paths) {
                this._initPaths(paths), this.redraw()
            },
            _parsePatternDef: function(patternDef) {
                var pattern = {
                    cache: [],
                    symbolFactory: patternDef.symbol,
                    isOffsetInPixels: !1,
                    isRepeatInPixels: !1
                };
                return "string" == typeof patternDef.offset && -1 != patternDef.offset.indexOf("%") ? pattern.offset = parseFloat(patternDef.offset) / 100 : (pattern.offset = parseFloat(patternDef.offset), pattern.isOffsetInPixels = pattern.offset > 0), "string" == typeof patternDef.repeat && -1 != patternDef.repeat.indexOf("%") ? pattern.repeat = parseFloat(patternDef.repeat) / 100 : (pattern.repeat = parseFloat(patternDef.repeat), pattern.isRepeatInPixels = pattern.repeat > 0), pattern
            },
            onAdd: function(map) {
                this._map = map, this._draw(), this._isZoomDependant && this._map.on("zoomend", this._softRedraw, this)
            },
            onRemove: function(map) {
                this._map.off("zoomend", this._softRedraw, this), this._map = null, L.LayerGroup.prototype.onRemove.call(this, map)
            },
            _buildSymbols: function(latLngs, symbolFactory, directionPoints) {
                for (var symbols = [], i = 0, l = directionPoints.length; l > i; i++) symbols.push(symbolFactory.buildSymbol(directionPoints[i], latLngs, this._map, i, l));
                return symbols
            },
            _getCache: function(pattern, zoom, pathIndex) {
                var zoomCache = pattern.cache[zoom];
                return "undefined" == typeof zoomCache ? (pattern.cache[zoom] = [], null) : zoomCache[pathIndex]
            },
            _getDirectionPoints: function(pathIndex, pattern) {
                var zoom = this._map.getZoom(),
                    dirPoints = this._getCache(pattern, zoom, pathIndex);
                if (dirPoints) return dirPoints;
                var offset, repeat, pathPixelLength = null,
                    latLngs = this._paths[pathIndex];
                return pattern.isOffsetInPixels ? (pathPixelLength = L.LineUtil.PolylineDecorator.getPixelLength(latLngs, this._map), offset = pattern.offset / pathPixelLength) : offset = pattern.offset, pattern.isRepeatInPixels ? (pathPixelLength = null !== pathPixelLength ? pathPixelLength : L.LineUtil.PolylineDecorator.getPixelLength(latLngs, this._map), repeat = pattern.repeat / pathPixelLength) : repeat = pattern.repeat, dirPoints = L.LineUtil.PolylineDecorator.projectPatternOnPath(latLngs, offset, repeat, this._map), pattern.cache[zoom][pathIndex] = dirPoints, dirPoints
            },
            redraw: function() {
                this._redraw(!0)
            },
            _softRedraw: function() {
                this._redraw(!1)
            },
            _redraw: function(clearCache) {
                if (null !== this._map) {
                    if (this.clearLayers(), clearCache)
                        for (var i = 0; i < this._patterns.length; i++) this._patterns[i].cache = [];
                    this._draw()
                }
            },
            _drawPattern: function(pattern) {
                for (var directionPoints, symbols, i = 0; i < this._paths.length; i++) {
                    directionPoints = this._getDirectionPoints(i, pattern), symbols = this._buildSymbols(this._paths[i], pattern.symbolFactory, directionPoints);
                    for (var j = 0; j < symbols.length; j++) this.addLayer(symbols[j])
                }
            },
            _draw: function() {
                for (var i = 0; i < this._patterns.length; i++) this._drawPattern(this._patterns[i])
            }
        }), L.polylineDecorator = function(paths, options) {
            return new L.PolylineDecorator(paths, options)
        }
    }, {
        "../libraries/leaflet": 11
    }],
    13: [function(require, module) {
        var Model = require("ampersand-model"),
            _ = require("underscore"),
            geo = require("../helpers/geo");
        module.exports = Model.extend({
            extraProperties: "reject",
            props: {
                coordinates: {
                    type: "array",
                    required: !0
                },
                type: {
                    type: "string",
                    "default": "MultiLineString"
                }
            },
            derived: {
                meters: {
                    deps: ["coordinates"],
                    fn: function() {
                        var latlngs = _.flatten(this.coordinates, !0);
                        return geo.distance(latlngs)
                    }
                }
            },
            appendStop: function(latlng, options) {
                options = options || {}, latlng = _.values(latlng);
                var coordinates = _.clone(this.coordinates);
                return 0 === coordinates.length ? (coordinates.push([latlng, latlng]), this.coordinates = coordinates, void(options.callback && options.callback())) : void geo.route({
                    from: _.last(this.getStops()),
                    to: latlng,
                    ignoreRoads: options.ignoreRoads
                }, function(route) {
                    coordinates.push(route), this.coordinates = coordinates, options.callback && options.callback()
                }, this)
            },
            moveStop: function(index, latlng, options) {
                options = options || {}, latlng = _.values(latlng), 0 === index ? this._moveFirstStop(latlng, options) : index === this.coordinates.length - 1 ? this._moveLastStop(latlng, options) : this._moveMiddleStop(latlng, index, options)
            },
            _moveFirstStop: function(latlng, options) {
                var coordinates = _.clone(this.coordinates),
                    secondStop = _.last(coordinates[1]);
                geo.route({
                    from: latlng,
                    to: secondStop,
                    ignoreRoads: options.ignoreRoads
                }, function(route) {
                    var firstStop = route[0];
                    coordinates[0] = [firstStop, firstStop], coordinates[1] = route, this.coordinates = coordinates, options.callback && options.callback()
                }, this)
            },
            _moveMiddleStop: function(latlng, index, options) {
                var coordinates = _.clone(this.coordinates),
                    prevStop = _.last(coordinates[index - 1]),
                    nextStop = _.last(coordinates[index + 1]);
                geo.route({
                    from: prevStop,
                    via: latlng,
                    to: nextStop,
                    ignoreRoads: options.ignoreRoads
                }, function(route) {
                    var closest = geo.closest(latlng, route);
                    coordinates[index] = route.slice(0, closest + 1), coordinates[index + 1] = route.slice(closest), this.coordinates = coordinates, options.callback && options.callback()
                }, this)
            },
            _moveLastStop: function(latlng, options) {
                var coordinates = _.clone(this.get("coordinates")),
                    penultimateStop = _.last(coordinates[coordinates.length - 2]);
                geo.route({
                    from: penultimateStop,
                    to: latlng,
                    ignoreRoads: options.ignoreRoads
                }, function(route) {
                    coordinates[coordinates.length - 1] = route, this.coordinates = coordinates, options.callback && options.callback()
                }, this)
            },
            insertStop: function(index, latlng, options) {
                options = options || {}, latlng = _.values(latlng);
                var coordinates = _.clone(this.coordinates),
                    prevStop = _.last(coordinates[index - 1]),
                    newSegment = [prevStop, latlng];
                coordinates.splice(index, 0, newSegment), this.set({
                    coordinates: coordinates
                }, {
                    silent: !0
                }), this.moveStop(index, latlng, options.callback)
            },
            removeStop: function(index, options) {
                options = options || {};
                var coordinates = _.clone(this.coordinates);
                if (1 === coordinates.length) return void this.model.clearStops(options);
                if (0 === index) {
                    var secondStop = _.last(coordinates[1]);
                    return coordinates.splice(0, 2, [secondStop, secondStop]), this.coordinates = coordinates, void(options.callback && options.callback())
                }
                if (index === coordinates.length - 1) return coordinates.splice(index, 1), this.coordinates = coordinates, void(options.callback && options.callback());
                var nextStop = _.last(coordinates[index + 1]);
                coordinates.splice(index, 1), this.set({
                    coordinates: coordinates
                }, {
                    silent: !0
                }), this.moveStop(index, nextStop, options)
            },
            clearStops: function(options) {
                options = options || {}, this.coordinates = [], options.callback && options.callback()
            },
            getStops: function() {
                return _.map(this.coordinates, _.last)
            },
            isEmpty: function() {
                return 0 === this.coordinates.length
            }
        })
    }, {
        "../helpers/geo": 9,
        "ampersand-model": 117,
        underscore: 189
    }],
    14: [function(require, module) {
        var Model = require("ampersand-model"),
            accounting = require("accounting"),
            jenks = require("turf-jenks"),
            _ = require("underscore");
        module.exports = Model.extend({
            props: {
                name: "string",
                description: "string",
                field: "string",
                colors: "array",
                geoJSON: "object",
                style: {
                    type: "string",
                    values: ["percentage", "absolute"]
                },
                tiles: "string",
                units: "string"
            },
            derived: {
                mainColor: {
                    deps: ["color"],
                    fn: function() {
                        return _.last(this.colors)
                    }
                },
                cutoffs: {
                    deps: ["field", "geoJSON"],
                    fn: function() {
                        if (0 === this.geoJSON.features.length) return [];
                        var cutoffs = jenks(this.geoJSON, this.field, 5);
                        return cutoffs.shift(), cutoffs.pop(), cutoffs
                    }
                },
                readableCutoffs: {
                    deps: ["cutoffs", "style"],
                    fn: function() {
                        if (0 === this.geoJSON.features.length) return [];
                        var formatted = [],
                            readable = [];
                        return formatted = this.cutoffs.map(function(c) {
                            return "absolute" === this.style ? accounting.formatNumber(1609.34 * c * 1609.34, 0) : (100 * c).toFixed(0) + "%"
                        }, this), readable.push("< " + formatted[0]), readable.push(formatted[0] + " - " + formatted[1]), readable.push(formatted[1] + " - " + formatted[2]), readable.push(formatted[2] + " - " + formatted[3]), readable.push("> " + formatted[3]), readable
                    }
                }
            }
        })
    }, {
        accounting: 59,
        "ampersand-model": 117,
        "turf-jenks": 187,
        underscore: 189
    }],
    15: [function(require, module) {
        var Collection = require("ampersand-collection"),
            Layer = require("../models/layer");
        module.exports = Collection.extend({
            model: Layer
        })
    }, {
        "../models/layer": 14,
        "ampersand-collection": 108
    }],
    16: [function(require, module) {
        var Direction = require("../models/direction"),
            Model = require("ampersand-model"),
            Windows = require("../models/windows"),
            app = require("ampersand-app"),
            accounting = require("accounting"),
            config = require("../config"),
            geo = require("../helpers/geo"),
            tinycolor = require("tinycolor2"),
            xhr = require("xhr"),
            _ = require("underscore");
        module.exports = Model.extend({
            modelType: "line",
            extraProperties: "reject",
            props: {
                color: {
                    type: "string",
                    required: !0,
                    "default": function() {
                        return _.sample(config.defaults.colors)
                    }
                },
                duplicatedFromId: "string",
                id: "string",
                mapId: "string",
                name: {
                    type: "string",
                    required: !0,
                    "default": function() {
                        return (100 * Math.random()).toFixed(0) + " " + _.sample(config.defaults.lineNames)
                    }
                }
            },
            children: {
                inbound: Direction,
                outbound: Direction
            },
            collections: {
                windows: Windows
            },
            session: {
                activeDirection: "object",
                createdAt: "date",
                desaturated: ["boolean", !0, !1],
                importState: {
                    type: "string",
                    "default": "not-imported",
                    values: ["not-imported", "importing", "imported"]
                },
                isHidden: {
                    type: "boolean",
                    "default": !1
                },
                serviceChangeTracker: ["number", !0, 0],
                popStat: "number",
                povertyStat: "number",
                statsLoaded: ["boolean", !0, !1],
                updatedAt: "date"
            },
            derived: {
                interfaceColor: {
                    deps: ["color", "desaturated"],
                    fn: function() {
                        return this.desaturated ? tinycolor(this.color).greyscale().lighten(30).toString() : this.color
                    }
                },
                meters: {
                    deps: ["inbound.meters", "outbound.meters"],
                    fn: function() {
                        return this.inbound.meters + this.outbound.meters
                    }
                },
                readableDistance: {
                    deps: ["meters"],
                    fn: function() {
                        return this.collection.parent.useMetricUnits ? (this.meters / 1e3).toFixed(2) + " km" : (this.meters / 1609.344).toFixed(2) + " miles"
                    }
                },
                serviceCalculations: {
                    deps: ["serviceChangeTracker", "meters"],
                    fn: function() {
                        var calcs = {
                            buses: 0,
                            serviceHours: 0,
                            serviceKilometers: 0
                        };
                        return 0 === this.meters ? calcs : (this.windows.forEach(function(window) {
                            if (window.isValid()) {
                                var parent = this.collection.parent,
                                    days = {
                                        saturday: parent.serviceSaturdays,
                                        sunday: parent.serviceSundays,
                                        weekday: parent.serviceWeekdays
                                    },
                                    serviceHours = window.buses * (window.duration / 60) * days[window.type],
                                    runtimeRatio = (window.runtime + window.layover) / window.runtime,
                                    serviceKilometers = serviceHours * window.speed / runtimeRatio;
                                window.buses > calcs.buses && (calcs.buses = window.buses), calcs.serviceHours += serviceHours, calcs.serviceKilometers += serviceKilometers
                            }
                        }, this), calcs)
                    }
                },
                buses: {
                    deps: ["serviceCalculations"],
                    fn: function() {
                        return this.serviceCalculations.buses
                    }
                },
                serviceHours: {
                    deps: ["serviceCalculations"],
                    fn: function() {
                        return this.serviceCalculations.serviceHours
                    }
                },
                isHighFrequency: {
                    deps: ["serviceCalculations"],
                    fn: function() {
                        var noon = 720,
                            minHeadway = 15;
                        return this.windows.some(function(window) {
                            return window.start <= noon && window.end >= noon && window.headway <= minHeadway && "weekday" === window.type
                        })
                    }
                },
                readableServiceHours: {
                    deps: ["serviceCalculations"],
                    fn: function() {
                        return accounting.formatNumber(this.serviceCalculations.serviceHours)
                    }
                },
                serviceKilometers: {
                    deps: ["serviceCalculations"],
                    fn: function() {
                        return this.serviceCalculations.serviceKilometers
                    }
                },
                cost: {
                    deps: ["serviceCalculations"],
                    fn: function() {
                        var hourCost = this.serviceHours * this.collection.parent.costPerHour,
                            busCost = this.buses * this.collection.parent.costPerBus,
                            distanceCost = this.serviceKilometers * this.collection.parent.costPerKm;
                        return hourCost + busCost + distanceCost
                    }
                },
                readableCost: {
                    deps: ["cost"],
                    fn: function() {
                        return this.cost >= 1e7 ? "$" + (this.cost / 1e6).toFixed(1) + " million" : this.cost >= 1e6 ? "$" + (this.cost / 1e6).toFixed(2) + " million" : this.cost > 1e3 ? "$" + (this.cost / 1e3).toFixed(0) + "k" : "$" + this.cost
                    }
                },
                readableBuses: {
                    deps: ["buses"],
                    fn: function() {
                        return 1 === this.buses ? "1 bus" : this.buses + " buses"
                    }
                },
                readablePopStat: {
                    deps: ["popStat"],
                    fn: function() {
                        return _.isNumber(this.popStat) ? accounting.format(this.popStat) : "..."
                    }
                },
                readablePovertyStat: {
                    deps: ["povertyStat"],
                    fn: function() {
                        return _.isNumber(this.povertyStat) ? (100 * this.povertyStat).toFixed(1) + "%" : "..."
                    }
                }
            },
            initialize: function() {
                var outboundOnly = this.inbound.isEmpty() && !this.outbound.isEmpty();
                this.activeDirection = outboundOnly ? this.outbound : this.inbound, this.listenTo(app, app.actions.COLORS_DESATURATE, function() {
                    this.desaturated = !0
                }), this.listenTo(app, app.actions.COLORS_SATURATE, function() {
                    this.desaturated = !1
                }), this.listenTo(this, "change:name change:color", function() {
                    this.save()
                }), this.listenTo(this.windows, "add remove change:start change:end change:headway change:speed", function() {
                    this.save()
                }), this.listenTo(this.inbound, "change:coordinates", function() {
                    this.killStats()
                }), this.listenTo(this.outbound, "change:coordinates", function() {
                    this.killStats()
                });
                var refreshStats = _.debounce(_.bind(this.refreshStats, this), 500);
                this.listenTo(this.inbound, "change:coordinates", refreshStats), this.listenTo(this.outbound, "change:coordinates", refreshStats), this.listenTo(this.windows, "add remove change:duration change:buses change:runtime change:layover", function() {
                    this.serviceChangeTracker++
                }), this.listenTo(this.collection.parent, "change:serviceSaturdays change:serviceSundays change:serviceWeekdays change:costPerHour change:costPerBus change:costPerKm", function() {
                    this.serviceChangeTracker++
                })
            },
            killStats: function() {
                this.popStat = void 0, this.povertyStat = void 0
            },
            refreshStats: function() {
                function afterRequest(err, resp, body) {
                    var attrs = JSON.parse(body);
                    this.popStat = attrs["b01003001.count"], this.povertyStat = attrs["c17002001.c17002002.c17002003.percent"]
                }
                this.statsLoaded = !0;
                var stops = this.inbound.getStops().concat(this.outbound.getStops());
                if (0 === stops.length) return this.popStat = 0, void(this.povertyStat = 0);
                var body = "fields=" + encodeURIComponent("b01003001.count,c17002001.c17002002.c17002003.percent");
                body += "&points=" + encodeURIComponent(JSON.stringify(geo.flipLatLng(stops)));
                var request = {
                    url: "https://turntable-transitmix.herokuapp.com/calculations",
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                    },
                    body: body
                };
                xhr(request, _.bind(afterRequest, this))
            },
            url: function() {
                return "/api/maps/" + this.mapId + "/lines/" + (this.id || "")
            },
            ajaxConfig: function() {
                var headers = {
                    "X-CSRF-Token": app.csrf,
                    Accept: "application/json"
                };
                return {
                    headers: headers
                }
            },
            parse: function(attrs) {
                return attrs.inbound && (attrs.inbound = geo.parseGeoJSON(attrs.inbound)), attrs.outbound && (attrs.outbound = geo.parseGeoJSON(attrs.outbound)), this.windows && delete attrs.windows, attrs
            },
            serialize: function() {
                var attrs = Model.prototype.serialize.apply(this, arguments);
                return attrs.inbound = geo.encodeGeoJSON(attrs.inbound), attrs.outbound = geo.encodeGeoJSON(attrs.outbound), attrs
            },
            save: function() {
                var map = this.collection.parent;
                app.user && map.authorId === app.user.id && Model.prototype.save.apply(this, arguments)
            }
        })
    }, {
        "../config": 7,
        "../helpers/geo": 9,
        "../models/direction": 13,
        "../models/windows": 22,
        accounting: 59,
        "ampersand-app": 60,
        "ampersand-model": 117,
        tinycolor2: 186,
        underscore: 189,
        xhr: 190
    }],
    17: [function(require, module) {
        var Collection = require("ampersand-rest-collection"),
            Line = require("../models/line");
        require("natural-compare-lite"), module.exports = Collection.extend({
            model: Line,
            comparator: function(a, b) {
                return String.naturalCompare(a.name, b.name)
            },
            initialize: function() {
                this.listenTo(this, "change:name", this.sort)
            }
        })
    }, {
        "../models/line": 16,
        "ampersand-rest-collection": 130,
        "natural-compare-lite": 184
    }],
    18: [function(require, module) {
        var Lines = require("../models/lines"),
            Model = require("ampersand-model"),
            Windows = require("../models/windows"),
            accounting = require("accounting"),
            app = require("ampersand-app"),
            config = require("../config"),
            geo = require("../helpers/geo"),
            _ = require("underscore");
        module.exports = Model.extend({
            modelType: "map",
            extraProperties: "reject",
            props: {
                authorId: "number",
                center: "array",
                city: "string",
                color: {
                    type: "string",
                    required: !0,
                    "default": function() {
                        return _.sample(config.defaults.colors)
                    }
                },
                costPerBus: ["number", !0, 0],
                costPerHour: ["number", !0, 100],
                costPerKm: ["number", !0, 0],
                id: "string",
                layoverForACTransit: {
                    type: "boolean",
                    required: !0,
                    "default": !1
                },
                layoverMinimum: {
                    type: "number",
                    required: !0,
                    "default": 0
                },
                layoverPercentage: {
                    type: "number",
                    required: !0,
                    "default": .1
                },
                name: ["string", !0, "Untitled Map"],
                serviceSaturdays: ["number", !0, 55],
                serviceSundays: ["number", !0, 55],
                serviceWeekdays: ["number", !0, 255],
                useCosting: ["boolean", !0, !0],
                useMetricUnits: ["boolean", !0, !0]
            },
            collections: {
                defaultWindows: Windows,
                lines: Lines
            },
            session: {
                createdAt: "date",
                distanceFromCentroid: "number",
                serviceChangeTracker: ["number", !0, 0],
                updatedAt: "date"
            },
            derived: {
                readableCostPerBus: {
                    deps: ["costPerBus"],
                    fn: function() {
                        return "$" + this.costPerBus.toFixed(2)
                    }
                },
                readableCostPerHour: {
                    deps: ["costPerHour"],
                    fn: function() {
                        return "$" + this.costPerHour.toFixed(2)
                    }
                },
                readableCostPerDistance: {
                    deps: ["costPerKm"],
                    fn: function() {
                        var cost = this.costPerKm;
                        return this.useMetricUnits || (cost = 1.609344 * cost), "$" + cost.toFixed(2)
                    }
                },
                readableLayoverPercentage: {
                    deps: ["layoverPercentage"],
                    fn: function() {
                        return 100 * this.layoverPercentage + "%"
                    }
                },
                readableLayoverMinimum: {
                    deps: ["layoverMinimum"],
                    fn: function() {
                        return this.layoverMinimum + " minutes"
                    }
                },
                serviceCalculations: {
                    deps: ["serviceChangeTracker"],
                    fn: function() {
                        var buses = 0,
                            count = 0,
                            totalServiceHours = 0,
                            totalCost = 0;
                        return this.lines.forEach(function(line) {
                            line.isHidden || (buses += line.buses, count++, totalServiceHours += line.serviceHours, totalCost += line.cost)
                        }), {
                            count: count,
                            buses: buses,
                            serviceHours: totalServiceHours,
                            cost: totalCost
                        }
                    }
                },
                buses: {
                    deps: ["serviceCalculations"],
                    fn: function() {
                        return this.serviceCalculations.buses
                    }
                },
                count: {
                    deps: ["serviceCalculations"],
                    fn: function() {
                        return this.serviceCalculations.count
                    }
                },
                serviceHours: {
                    deps: ["serviceCalculations"],
                    fn: function() {
                        return this.serviceCalculations.serviceHours
                    }
                },
                cost: {
                    deps: ["serviceCalculations"],
                    fn: function() {
                        return this.serviceCalculations.cost
                    }
                },
                readableServiceHours: {
                    deps: ["serviceCalculations"],
                    fn: function() {
                        return accounting.format(this.serviceCalculations.serviceHours)
                    }
                },
                readableCost: {
                    deps: ["serviceCalculations"],
                    fn: function() {
                        return this.cost >= 1e7 ? "$" + (this.cost / 1e6).toFixed(1) + " million" : this.cost >= 1e6 ? "$" + (this.cost / 1e6).toFixed(2) + " million" : this.cost > 1e3 ? "$" + (this.cost / 1e3).toFixed(0) + "k" : "$" + this.cost
                    }
                }
            },
            initialize: function() {
                this.listenTo(this, "change:name change:color change:costPerBus change:costPerHour change:costPerKm change:layoverPercentage change:layoverMinimum change:layoverForACTransit change:serviceSaturdays change:serviceSundays change:serviceWeekdays change:useCosting", function() {
                    this.save()
                }), this.listenTo(this.defaultWindows, "add remove change:start change:end change:headway change:speed", function() {
                    this.save()
                }), this.listenTo(this.lines, "add remove change:serviceCalculations change:isHidden", function() {
                    this.serviceChangeTracker++
                }), this.listenTo(this.lines, "add remove change:updatedAt", function() {
                    this.updatedAt = new Date
                })
            },
            url: function() {
                return "/api/maps/" + (this.id || "")
            },
            ajaxConfig: function() {
                var headers = {
                    "X-CSRF-Token": app.csrf,
                    Accept: "application/json"
                };
                return {
                    headers: headers
                }
            },
            parse: function(attrs) {
                return attrs.center = geo.parseGeoJSON(attrs.center).coordinates, this.defaultWindows && this.defaultWindows.length > 0 && delete attrs.defaultWindows, attrs
            },
            serialize: function() {
                var attrs = Model.prototype.serialize.apply(this, arguments);
                return attrs.center = geo.encodeGeoJSON({
                    type: "Point",
                    coordinates: attrs.center
                }), delete attrs.lines, attrs
            },
            save: function() {
                !app.user || this.authorId && this.authorId !== app.user.id || Model.prototype.save.apply(this, arguments)
            }
        })
    }, {
        "../config": 7,
        "../helpers/geo": 9,
        "../models/lines": 17,
        "../models/windows": 22,
        accounting: 59,
        "ampersand-app": 60,
        "ampersand-model": 117,
        underscore: 189
    }],
    19: [function(require, module) {
        var Collection = require("ampersand-rest-collection"),
            MapModel = require("../models/map"),
            app = require("ampersand-app");
        module.exports = Collection.extend({
            model: MapModel,
            url: "/api/maps/",
            ajaxConfig: function() {
                return {
                    headers: {
                        "X-CSRF-Token": app.csrf
                    }
                }
            },
            comparator: function(a, b) {
                return a.updatedAt > b.updatedAt ? -1 : 1
            },
            initialize: function() {
                this.listenTo(this, "change:updatedAt", this.sort)
            }
        })
    }, {
        "../models/map": 18,
        "ampersand-app": 60,
        "ampersand-rest-collection": 130
    }],
    20: [function(require, module) {
        var Model = require("ampersand-model");
        module.exports = Model.extend({
            extraProperties: "reject",
            props: {
                id: {
                    type: "number",
                    required: !0
                },
                firstName: {
                    type: "string",
                    required: !0
                },
                lastName: {
                    type: "string",
                    required: !0
                },
                org: {
                    type: "string",
                    required: !0
                }
            }
        })
    }, {
        "ampersand-model": 117
    }],
    21: [function(require, module) {
        var Model = require("ampersand-model");
        module.exports = Model.extend({
            props: {
                start: "number",
                end: "number",
                headway: "number",
                speed: "number",
                type: {
                    type: "string",
                    values: ["weekday", "saturday", "sunday"]
                }
            },
            session: {
                inboundChange: {
                    type: "number",
                    "default": 0
                },
                outboundChange: {
                    type: "number",
                    "default": 0
                },
                layoverChange: {
                    type: "number",
                    "default": 0
                }
            },
            derived: {
                duration: {
                    deps: ["start", "end"],
                    fn: function() {
                        var diff = this.end - this.start;
                        return 0 > diff && (diff += 1440), diff
                    }
                },
                inboundRuntime: {
                    deps: ["speed", "inboundChange"],
                    fn: function() {
                        var line = this.getLine();
                        if (!line) return 0;
                        var km = line.inbound.meters / 1e3;
                        return km / this.speed * 60
                    }
                },
                outboundRuntime: {
                    deps: ["speed", "outboundChange"],
                    fn: function() {
                        var line = this.getLine();
                        if (!line) return 0;
                        var km = line.outbound.meters / 1e3;
                        return km / this.speed * 60
                    }
                },
                runtime: {
                    deps: ["inboundRuntime", "outboundRuntime"],
                    fn: function() {
                        return this.inboundRuntime + this.outboundRuntime
                    }
                },
                layover: {
                    deps: ["runtime", "layoverChange"],
                    fn: function() {
                        var map = this.getMap(),
                            layover = 0;
                        return [this.inboundRuntime, this.outboundRuntime].forEach(function(runtime) {
                            return 0 === runtime ? 0 : void(layover += map.layoverForACTransit && runtime > 60 ? 12 : Math.max(runtime * map.layoverPercentage, map.layoverMinimum))
                        }, this), layover
                    }
                },
                buses: {
                    deps: ["runtime", "layover", "headway"],
                    fn: function() {
                        return Math.ceil((this.runtime + this.layover) / this.headway)
                    }
                },
                wiggle: {
                    deps: ["headway", "runtime", "layover", "buses"],
                    fn: function() {
                        var nextBreakPoint = this.buses * this.headway;
                        return nextBreakPoint - (this.runtime + this.layover)
                    }
                },
                readableStart: {
                    deps: ["start"],
                    fn: function() {
                        return this._toTime(this.start)
                    }
                },
                readableEnd: {
                    deps: ["end"],
                    fn: function() {
                        return this._toTime(this.end)
                    }
                },
                readableHeadway: {
                    deps: ["headway"],
                    fn: function() {
                        return this.headway + " min"
                    }
                },
                readableSpeed: {
                    deps: ["speed"],
                    fn: function() {
                        var map = this.getMap();
                        return map.useMetricUnits ? this.speed.toFixed(1) + " kph" : (.621371 * this.speed).toFixed(1) + " mph"
                    }
                },
                readableDuration: {
                    deps: ["duration"],
                    fn: function() {
                        return this.duration.toFixed(0) + " min"
                    }
                },
                readableRuntime: {
                    deps: ["runtime"],
                    fn: function() {
                        return this.runtime.toFixed(1) + " min"
                    }
                },
                readableLayover: {
                    deps: ["layover"],
                    fn: function() {
                        return this.layover.toFixed(1) + " min"
                    }
                },
                readableBuses: {
                    deps: ["buses"],
                    fn: function() {
                        return 1 === this.buses ? "1 bus" : this.buses + " buses"
                    }
                },
                readableWiggle: {
                    deps: ["wiggle"],
                    fn: function() {
                        return this.wiggle.toFixed(1) + " min"
                    }
                }
            },
            getLine: function() {
                return this.collection && this.collection.parent && "line" === this.collection.parent.getType() ? this.collection.parent : void 0
            },
            getMap: function() {
                return this.collection && this.collection.parent ? "map" === this.collection.parent.getType() ? this.collection.parent : this.getLine().collection.parent : void 0
            },
            initialize: function() {
                var line = this.getLine();
                line && (this.listenTo(line.inbound, "change:meters", function() {
                    this.inboundChange++
                }), this.listenTo(line.outbound, "change:meters", function() {
                    this.outboundChange++
                }));
                var map = this.getMap();
                map && this.listenTo(map, "change:layoverPercentage change:layoverMinimum change:layoverForACTransit", function() {
                    this.layoverChange++
                })
            },
            _toTime: function(number) {
                var hours = Math.floor(number / 60);
                10 > hours && (hours = "0" + hours);
                var minutes = number % 60;
                return 10 > minutes && (minutes = "0" + minutes), hours + ":" + minutes
            }
        })
    }, {
        "ampersand-model": 117
    }],
    22: [function(require, module) {
        var Collection = require("ampersand-collection"),
            Window = require("../models/window");
        module.exports = Collection.extend({
            model: Window
        })
    }, {
        "../models/window": 21,
        "ampersand-collection": 108
    }],
    23: [function(require, module) {
        var HomeView = require("./views/home"),
            Router = require("ampersand-router"),
            app = require("ampersand-app"),
            analytics = require("./helpers/analytics"),
            AppRouter = Router.extend({
                routes: {
                    "map/:mapid/line/:lineid(/)": "map",
                    "map/:mapid(/)": "map",
                    "": "home",
                    "*default": "error"
                },
                map: function(mapId, lineId) {
                    var options = {
                        mapId: mapId,
                        lineId: lineId
                    };
                    return app.selectedMap && app.selectedMap.id === options.mapId ? void(lineId ? app.trigger(app.actions.LINE_SELECT, options) : app.trigger(app.actions.LINE_DESELECT, options)) : void app.trigger(app.actions.MAP_LOAD, options);

                },
                home: function() {
                    return app.user ? (this.home = (new HomeView).render(), document.body.appendChild(this.home.el), void app.trigger(app.actions.MAP_DESELECT)) : void(window.location.href = "/users/sign_in")
                },
                error: function() {
                    console.log("Route not found. Mild moment of panic."), this.navigate("/", {
                        trigger: !0,
                        replace: !0
                    })
                },
                init: function() {
                    this.history.start({
                        pushState: !0,
                        root: "/"
                    })
                },
                navigate: function(fragment) {
                    var prevFragment = "/" + this.history.getFragment();
                    fragment !== prevFragment && analytics.trackPage(fragment), Router.prototype.navigate.apply(this, arguments)
                }
            });
        module.exports = new AppRouter
    }, {
        "./helpers/analytics": 8,
        "./views/home": 28,
        "ampersand-app": 60,
        "ampersand-router": 142
    }],
    24: [function(require, module) {
        var LeafletView = require("../views/leaflet"),
            PaneView = require("../views/pane"),
            PermissionsView = require("../views/permissions"),
            SidebarView = require("../views/sidebar"),
            View = require("ampersand-view"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <body>
                      <div data-hook="permissions"></div>
                      <div class="main-app">
                        <div id="leaflet-container"></div>
                        <div data-hook="sidebar"></div>
                        <div data-hook="panes"></div>
                      </div>
                    </body>
                  */
                console.log()
            }),
            events: {
                "focus input:not(.dont-focus)": "selectOnFocus",
                keyup: "blurOnEnter"
            },
            render: function() {
                return this.renderWithTemplate(this), this.registerSubview(new LeafletView).render(), this.renderSubview(new SidebarView, this.queryByHook("sidebar")), this.renderSubview(new PaneView, this.queryByHook("panes")), this.renderSubview(new PermissionsView, this.queryByHook("permissions")), this
            },
            selectOnFocus: function(event) {
                setTimeout(function() {
                    event.target.select()
                }, 0)
            },
            blurOnEnter: function(event) {
                13 === event.which && event.target.blur()
            }
        })
    }, {
        "../views/leaflet": 39,
        "../views/pane": 47,
        "../views/permissions": 51,
        "../views/sidebar": 55,
        "ampersand-view": 157,
        multiline: 182
    }],
    25: [function(require, module) {
        var View = require("ampersand-view"),
            multiline = require("multiline"),
            tinycolor = require("tinycolor2");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="color-dot"></div>
                  */
                console.log()
            }),
            props: {
                color: "string"
            },
            events: {
                click: "setColor"
            },
            render: function() {
                return this.renderWithTemplate(this), this.el.style.backgroundColor = tinycolor(this.color).lighten(10).toString(), this
            },
            setColor: function() {
                this.model.color = this.color
            }
        })
    }, {
        "ampersand-view": 157,
        multiline: 182,
        tinycolor2: 186
    }],
    26: [function(require, module) {
        var View = require("ampersand-view"),
            app = require("ampersand-app"),
            dom = require("ampersand-dom"),
            multiline = require("multiline"),
            tinycolor = require("tinycolor2");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="direction-toggle">
                      <div class="direction-toggle-notification" data-hook="notification">
                        <div>Click on map<br>to start drawing.</div>
                        <div class="direction-toggle-arrow" data-hook="arrow"></div>
                      </div>
                      <div class="direction-toggle-in" data-hook="inbound">inbound</div><div class="direction-toggle-out" data-hook="outbound">outbound</div>
                    </div>
                  */
                console.log()
            }),
            props: {
                isExpanded: {
                    type: "boolean",
                    "default": function() {
                        return app.state.isExpanded
                    }
                }
            },
            bindings: {
                isExpanded: {
                    type: "booleanClass",
                    name: "is-expanded"
                },
                "model.activeDirection": {
                    type: function() {
                        this.model.activeDirection === this.model.inbound ? (dom.addClass(this.queryByHook("inbound"), "active"), dom.removeClass(this.queryByHook("outbound"), "active"), dom.removeClass(this.queryByHook("notification"), "outbound")) : (dom.removeClass(this.queryByHook("inbound"), "active"), dom.addClass(this.queryByHook("outbound"), "active"), dom.addClass(this.queryByHook("notification"), "outbound"))
                    }
                },
                "model.interfaceColor": {
                    type: function() {
                        var original = this.model.interfaceColor,
                            darkest = tinycolor(this.model.interfaceColor).darken(25).toString();
                        this.el.style.backgroundColor = original, this.queryByHook("notification").style.backgroundColor = darkest, this.queryByHook("arrow").style.borderTopColor = darkest
                    }
                }
            },
            events: {
                "click [data-hook=inbound]": "activateInbound",
                "click [data-hook=outbound]": "activateOutbound"
            },
            initialize: function() {
                this.listenTo(this.model.inbound, "change:coordinates", this.renderNotification), this.listenTo(this.model.outbound, "change:coordinates", this.renderNotification), this.listenTo(this.model, "change:activeDirection", this.renderNotification), this.listenTo(app.state, "change:isExpanded", function() {
                    this.isExpanded = app.state.isExpanded
                })
            },
            render: function() {
                return this.renderWithTemplate(this), this.renderNotification(), this
            },
            renderNotification: function() {
                0 === this.model.activeDirection.coordinates.length ? dom.show(this.queryByHook("notification")) : dom.hide(this.queryByHook("notification"))
            },
            activateInbound: function() {
                this.model.activeDirection = this.model.inbound
            },
            activateOutbound: function() {
                this.model.activeDirection = this.model.outbound
            }
        })
    }, {
        "ampersand-app": 60,
        "ampersand-dom": 116,
        "ampersand-view": 157,
        multiline: 182,
        tinycolor2: 186
    }],
    27: [function(require, module) {
        var View = require("ampersand-view"),
            app = require("ampersand-app"),
            dom = require("ampersand-dom"),
            multiline = require("multiline"),
            xhr = require("xhr");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="help">
                      <section data-hook="myAccount">
                        <h1>My Account</h1>
                        <div data-hook="logout" class="help-action">Logout...</div>
                      </section>
                      <section>
                        <h1>Help</h1>
                        <div class="help-letter">
                          <p>Need help? Have feedback? Want to share words of wisdom?</p>
                          <p>Email us at <a href="mailto:team@transitmix.net">team@transitmix.net</a> or call me at <span class="phone">415-503-9174</span>.</p>
                          <p><span class="name">Sam Hashemi</span><br>Co-founder & CEO</p>
                        </div>
                      </section>
                      <section>
                        <h1>Frequently Asked Questions</h1>
                        <div class="help-faq">
                          <div class="help-question">How do you calculate costs?</div>
                          <div class="help-answer">The costs are estimated using a 3-factor model you can modify by clicking the gear on the left. The underlying service hour calculations are made using <a target="_blank" href="http://www.humantransit.org/02box.html">this formula</a>.</div>
                        </div>

                        <div class="help-faq">
                          <div class="help-question">How do I draw off roads?</div>
                          <div class="help-answer">Just hold the shift key while drawing.</div>
                        </div>

                        <div class="help-faq">
                          <div class="help-question">Where does your geospatial data come from?</div>
                          <div class="help-answer">We use the US Census 2009-2013 American Community Survey data set. You can read more about it <a target="_blank" href="http://www.census.gov/acs/www/about_the_survey/american_community_survey/">here</a>.</div>
                        </div>

                        <div class="help-faq">
                          <div class="help-question">Does it do X? It should do X.</div>
                          <div class="help-answer">We're building this for you, so let us know if something is missing. We're listening: <a href="mailto:team@transitmix.net">team@transitmix.net</a></div>
                        </div>
                      </section>
                    </div>
                  */
                console.log()
            }),
            events: {
                "click [data-hook=logout]": "logout"
            },
            render: function() {
                return this.renderWithTemplate(this), app.user || dom.hide(this.queryByHook("myAccount")), this
            },
            logout: function() {
                xhr({
                    url: "/users/sign_out",
                    method: "DELETE",
                    headers: {
                        "X-CSRF-Token": app.csrf
                    }
                }, function() {
                    window.location.href = "/users/sign_in"
                })
            }
        })
    }, {
        "ampersand-app": 60,
        "ampersand-dom": 116,
        "ampersand-view": 157,
        multiline: 182,
        xhr: 190
    }],
    28: [function(require, module) {
        var MyMapsView = require("../views/my-maps"),
            View = require("ampersand-view"),
            app = require("ampersand-app"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="home">
                      <div>
                        <div class="home-welcome">Transitmix Pro</div>
                        <div data-hook="myMaps"></div>
                      </div>
                    </div>
                  */
                console.log()
            }),
            initialize: function() {
                this.listenTo(app, app.actions.MAP_SELECT_COMPLETED, this.remove)
            },
            render: function() {
                return this.renderWithTemplate(this), this.renderSubview(new MyMapsView, this.queryByHook("myMaps")), this
            }
        })
    }, {
        "../views/my-maps": 41,
        "ampersand-app": 60,
        "ampersand-view": 157,
        multiline: 182
    }],
    29: [function(require, module) {
        var View = require("ampersand-view"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <section>
                      <h1>No nearby agencies found</h1>
                      <div class="import-description">
                        <p>We didn't find any GTFS for this area.</p>
                        <p>:(</p>
                        <p>Does this sound wrong? Email us at <a href="mailto:support@transitmix.net">support@transitmix.net</a></p>
                      </div>
                    </section>
                  */
                console.log()
            })
        })
    }, {
        "ampersand-view": 157,
        multiline: 182
    }],
    30: [function(require, module) {
        var View = require("ampersand-view"),
            app = require("ampersand-app"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="import-item" data-hook="name"></div>
                  */
                console.log()
            }),
            bindings: {
                "model.name": {
                    hook: "name"
                },
                "model.importState": {
                    type: "class",
                    hook: "name"
                }
            },
            events: {
                click: "importLine"
            },
            importLine: function() {
                var importState = this.model.importState;
                "importing" !== importState && "imported" !== importState && app.trigger(app.actions.LINE_IMPORT, {
                    agencyId: this.model.mapId,
                    lineId: this.model.id
                })
            }
        })
    }, {
        "ampersand-app": 60,
        "ampersand-view": 157,
        multiline: 182
    }],
    31: [function(require, module) {
        var View = require("ampersand-view"),
            app = require("ampersand-app"),
            multiline = require("multiline"),
            ItemView = require("../views/import-item");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <section>
                      <h1 data-hook="agency"></h1>
                      <div data-hook="items"></div>
                    </section>
                  */
                console.log()
            }),
            props: {
                clickedAlready: ["boolean", !0, !1]
            },
            bindings: {
                "model.name": {
                    hook: "agency"
                }
            },
            events: {
                "click [data-hook=agency]": "importAllLines"
            },
            render: function() {
                return this.renderWithTemplate(this), this.renderCollection(this.model.lines, ItemView, this.queryByHook("items")), this
            },
            importAllLines: function() {
                this.clickedAlready || (this.clickedAlready = !0, app.trigger(app.actions.LINE_IMPORT_ALL, {
                    agencyId: this.model.id
                }))
            }
        })
    }, {
        "../views/import-item": 30,
        "ampersand-app": 60,
        "ampersand-view": 157,
        multiline: 182
    }],
    32: [function(require, module) {
        var CollectionView = require("ampersand-collection-view"),
            EmptyView = require("../views/import-empty"),
            SectionView = require("../views/import-section"),
            View = require("ampersand-view"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="import" data-hook="sections"></div>
                  */
                console.log()
            }),
            render: function() {
                this.renderWithTemplate(this);
                var view = new CollectionView({
                    collection: this.collection,
                    view: SectionView,
                    emptyView: EmptyView,
                    el: this.queryByHook("sections")
                }).render();
                return this.registerSubview(view), this
            }
        })
    }, {
        "../views/import-empty": 29,
        "../views/import-section": 31,
        "ampersand-collection-view": 106,
        "ampersand-view": 157,
        multiline: 182
    }],
    33: [function(require, module) {
        var View = require("ampersand-view"),
            app = require("ampersand-app"),
            dom = require("ampersand-dom"),
            domify = require("domify"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                  <section class="layers-section">
                    <div data-hook="sectionHeader">
                      <h1 data-hook="name"></h1>
                      <div data-hook="description" class="layers-description"></div>
                    </div>
                    <div data-hook="legend" class="layers-legend"></div>
                  </section>
                */
                console.log()
            }),
            bindings: {
                "model.name": {
                    hook: "name"
                },
                "model.description": {
                    hook: "description"
                },
                "model.mainColor": {
                    type: function() {
                        this.queryByHook("sectionHeader").style.backgroundColor = this.model.mainColor
                    }
                }
            },
            events: {
                click: "selectLayer"
            },
            initialize: function() {
                this.listenTo(app.state, "change:selectedLayer", this.updateSelected)
            },
            render: function() {
                this.renderWithTemplate(this), this.updateSelected();
                for (var cutoffs = this.model.readableCutoffs, i = cutoffs.length - 1; i >= 0; i--) {
                    var content = '<span class="cutoff">' + cutoffs[i] + "</span>";
                    content += '<span class="units">' + this.model.units + "</span>";
                    var frag = domify('<div class="layer-legend-item">' + content + "</div>");
                    frag.style.backgroundColor = this.model.mainColor, frag.style.opacity = .1 * i + .5, this.queryByHook("legend").appendChild(frag)
                }
                return this
            },
            updateSelected: function() {
                app.state.selectedLayer === this.model ? dom.addClass(this.el, "active") : dom.removeClass(this.el, "active")
            },
            selectLayer: function() {
                app.state.selectedLayer = this.model
            }
        })
    }, {
        "ampersand-app": 60,
        "ampersand-dom": 116,
        "ampersand-view": 157,
        domify: 174,
        multiline: 182
    }],
    34: [function(require, module) {
        var SectionView = require("../views/layers-section"),
            View = require("ampersand-view"),
            app = require("ampersand-app"),
            dom = require("ampersand-dom"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="layers">
                      <div data-hook="layers-items"></div>
                      <section data-hook="loading" class="layers-loading">
                        <h1>Loading spatial data...</h1>
                        <div class="layers-loading-spinner"></div>
                      </section>
                      <section class="layers-empty" data-hook="empty" style="display:none">
                        <h1>No nearby spatial data</h1>
                        <div class="layers-description">
                          <p>We didn't find any geospatial data (like census or jobs) for this area.</p>
                          <p>Does this sound wrong? Email us at <a href="mailto:support@transitmix.net">support@transitmix.net</a></p>
                        </div>
                      </section>
                    </div>
                  */
                console.log()
            }),
            initialize: function() {
                this.listenTo(app.state, "change:isLoadingLayers", this.toggleLoading)
            },
            render: function() {
                this.renderWithTemplate(this), this.renderCollection(app.layers, SectionView, this.queryByHook("layers-items")), this.toggleLoading()
            },
            toggleLoading: function() {
                app.state.isLoadingLayers ? dom.show(this.queryByHook("loading")) : (dom.hide(this.queryByHook("loading")), app.layers.length < 3 && dom.show(this.queryByHook("empty")))
            }
        })
    }, {
        "../views/layers-section": 33,
        "ampersand-app": 60,
        "ampersand-dom": 116,
        "ampersand-view": 157,
        multiline: 182
    }],
    35: [function(require, module) {
        var View = require("ampersand-view"),
            _ = require("underscore"),
            app = require("ampersand-app"),
            events = require("events-mixin"),
            geo = require("../helpers/geo"),
            leaflet = require("../libraries/leaflet");
        require("../libraries/leaflet.polylineDecorator"), require("../libraries/leaflet-shift-patch"), module.exports = View.extend({
            insertSelf: !0,
            props: {
                polyline: "object",
                decorator: "object",
                markers: {
                    type: "array",
                    required: "true"
                },
                insertMarker: "object",
                drawingLine: "object",
                isDrawing: ["boolean", !0, !1],
                isDraggingMarker: ["boolean", !0, !1],
                ignoreRoads: ["boolean", !0, !1],
                keyboardEvents: "object"
            },
            initialize: function() {
                this.polyline = leaflet.polyline({}, {
                    color: this.model.parent.interfaceColor,
                    opacity: 1,
                    weight: 9
                }).addTo(leaflet.instance), this.listenTo(this.model, "change:coordinates", this.renderPolyline), this.listenTo(this.model, "change:coordinates", this.renderDecorator), this.listenTo(this.model.parent, "change:interfaceColor", this.updateColor), this.keyboardEvents = events(document.body, this), this.keyboardEvents.bind("keyup", "checkShiftKey"), this.keyboardEvents.bind("keydown", "checkShiftKey")
            },
            render: function() {
                leaflet.instance.on("click", this.clearSelection, this), this.renderPolyline(), this.renderDecorator(), this.renderMarkers(), this.hookupInsert();
                var stops = this.model.getStops();
                return stops.length < 2 && this.startDrawing(), this
            },
            renderPolyline: function() {
                this.polyline.setLatLngs(this.model.coordinates)
            },
            renderDecorator: function() {
                if (this.removeDecorator(), !(this.model.coordinates.length < 2)) {
                    var latlngs = _.flatten(this.model.coordinates, !0),
                        symbol = new leaflet.Symbol.Arrow({
                            polygon: !1,
                            pixelSize: 8,
                            headAngle: 90,
                            pathOptions: {
                                opacity: .6,
                                weight: 5,
                                color: this.model.parent.interfaceColor
                            }
                        });
                    this.decorator = leaflet.polylineDecorator(latlngs, {
                        patterns: [{
                            offset: 50,
                            repeat: "300px",
                            symbol: symbol
                        }]
                    }).addTo(leaflet.instance)
                }
            },
            removeDecorator: function() {
                this.decorator && (leaflet.instance.removeLayer(this.decorator), this.decorator = void 0)
            },
            updateColor: function() {
                var options = {
                    color: this.model.parent.interfaceColor
                };
                this.polyline.setStyle(options), this.drawingLine && this.drawingLine.setStyle(options), this.markers.forEach(function(marker) {
                    marker._icon.children[0].style.borderColor = options.color
                }), this.renderDecorator()
            },
            clearSelection: function() {
                this.isDrawing || this.isDraggingMarker || app.trigger(app.actions.LINE_DESELECT)
            },
            remove: function() {
                leaflet.instance.off("click", this.clearSelection, this), this.removeMarkers(), this.removeDrawing(), this.teardownInsert(), this.removeDecorator(), this.keyboardEvents.unbind(), leaflet.instance.removeLayer(this.polyline), View.prototype.remove.apply(this, arguments)
            },
            startDrawing: function() {
                this.isDrawing = !0, leaflet.DomUtil.addClass(leaflet.instance.getContainer(), "drawingMode"), this.drawingLine = leaflet.polyline([], {
                    color: this.model.parent.interfaceColor,
                    opacity: 1,
                    weight: 9
                }).addTo(leaflet.instance), this._throttledDrawLine = _.throttle(this._updateDrawLine, 250), leaflet.instance.on("mousemove", this._throttledDrawLine, this), leaflet.instance.on("click", this._draw, this)
            },
            removeDrawing: function() {
                this.isDrawing = !1, leaflet.DomUtil.removeClass(leaflet.instance.getContainer(), "drawingMode"), this.drawingLine && leaflet.instance.removeLayer(this.drawingLine), leaflet.instance.off("mousemove", this._throttledDrawLine, this), leaflet.instance.off("click", this._draw, this)
            },
            _draw: function(event) {
                this.model.appendStop(event.latlng, {
                    ignoreRoads: this.ignoreRoads
                }), this.addMarker(event.latlng)
            },
            _updateDrawLine: function(event) {
                var stops = this.model.getStops();
                0 !== stops.length && geo.route({
                    from: _.last(stops),
                    to: _.values(event.latlng),
                    ignoreRoads: this.ignoreRoads
                }, function(route) {
                    this.drawingLine.setLatLngs(route)
                }, this)
            },
            renderMarkers: function() {
                this.removeMarkers();
                var stops = this.model.getStops();
                stops.forEach(function(latlng, stopIndex) {
                    this.addMarker(latlng, stopIndex)
                }, this)
            },
            addMarker: function(latlng, stopIndex) {
                var html = '<div class="mapMarker" style="border-color:' + this.model.parent.interfaceColor + '"></div>',
                    classNames = "mapMarkerWrapper";
                classNames += this.isDrawing ? " showDrawingTooltip" : " showMarkerTooltip";
                var icon = leaflet.divIcon({
                        className: classNames,
                        html: html
                    }),
                    lastMarker = _.last(this.markers);
                lastMarker && leaflet.DomUtil.removeClass(lastMarker._icon, "showDrawingTooltip");
                var marker = leaflet.marker(latlng, {
                    icon: icon,
                    draggable: !this.isDrawing
                }).addTo(leaflet.instance);
                marker.stopIndex = stopIndex, marker.on("mousedown", function() {
                    leaflet.DomUtil.removeClass(marker._icon, "showMarkerTooltip")
                }), marker.on("click", this._removeStop, this), marker.on("dragstart", function() {
                    this.isDraggingMarker = !0
                }, this), marker.on("drag", _.throttle(this._moveStop, 250), this), marker.on("dragend", function() {
                    var self = this;
                    setTimeout(function() {
                        self.isDraggingMarker = !1
                    }, 0), setTimeout(function() {
                        self.renderMarkers()
                    }, 250)
                }, this), this.markers.push(marker)
            },
            removeMarkers: function() {
                this.markers.forEach(function(marker) {
                    leaflet.instance.removeLayer(marker)
                }), this.markers = []
            },
            _moveStop: function(event) {
                if (!this.isDrawing) {
                    var latlng = event.target._latlng,
                        stopIndex = event.target.stopIndex,
                        self = this;
                    this.model.moveStop(stopIndex, latlng, {
                        ignoreRoads: this.ignoreRoads,
                        callback: function() {
                            self.model.parent.save()
                        }
                    })
                }
            },
            _removeStop: function(event) {
                var self = this;
                if (this.isDrawing) return this.removeDrawing(), setTimeout(function() {
                    self.renderMarkers()
                }, 250), void setTimeout(function() {
                    self.model.parent.save()
                }, 250);
                var stops = this.model.getStops();
                stops.length <= 2 ? (this.model.clearStops(), this.startDrawing(), this.model.parent.save()) : this.model.removeStop(event.target.stopIndex, {
                    ignoreRoads: this.ignoreRoads,
                    callback: function() {
                        self.model.parent.save()
                    }
                }), this.renderMarkers()
            },
            hookupInsert: function() {
                this.polyline.on("mousedown", this._dragToInsert, this), this.polyline.on("mousemove", this._showInsertMarker, this), this.polyline.on("mouseout", this._hideInsertMarker, this)
            },
            teardownInsert: function() {
                this.polyline.off("mousedown", this._dragToInsert, this)
            },
            _showInsertMarker: function(event) {
                if (!this.insertMarker) {
                    var html = '<div class="mapMarker"></div>',
                        icon = leaflet.divIcon({
                            className: "mapMarkerWrapper u-noEvents",
                            html: html
                        });
                    this.insertMarker = leaflet.marker(event.latlng, {
                        icon: icon
                    }).addTo(leaflet.instance)
                }
                this.insertMarker.setLatLng(event.latlng)
            },
            _hideInsertMarker: function() {
                this.isDraggingMarker || this.insertMarker && (leaflet.instance.removeLayer(this.insertMarker), this.insertMarker = void 0)
            },
            _dragToInsert: function(event) {
                if (!this.isDrawing) {
                    this.isDraggingMarker = !0, leaflet.instance.dragging.disable();
                    var stopIndex = this._findStopIndex(event);
                    this.model.insertStop(stopIndex, event.latlng, {
                        ignoreRoads: this.ignoreRoads
                    });
                    var throttledMoveStop = _.throttle(function(event) {
                        this.model.moveStop(stopIndex, event.latlng, {
                            ignoreRoads: this.ignoreRoads
                        })
                    }, 250);
                    leaflet.instance.on("mousemove", throttledMoveStop, this), leaflet.instance.on("mousemove", this._showInsertMarker, this);
                    var self = this;
                    document.body.addEventListener("mouseup", function onMouseUp() {
                        document.body.removeEventListener("mouseup", onMouseUp), leaflet.instance.off("mousemove", throttledMoveStop, self), leaflet.instance.off("mousemove", self._showInsertMarker, self), leaflet.instance.dragging.enable(), setTimeout(function() {
                            self.isDraggingMarker = !1
                        }, 0), setTimeout(function() {
                            self.renderMarkers()
                        }, 250), setTimeout(function() {
                            self.model.parent.save()
                        }, 250)
                    })
                }
            },
            _findStopIndex: function(event) {
                var closestIndex, point = event.layerPoint,
                    closestDistance = 1 / 0;
                return this.polyline._rings.forEach(function(ring, index) {
                    for (var i = 0; i < ring.length - 1; i++) {
                        var dist = leaflet.LineUtil.pointToSegmentDistance(point, ring[i], ring[i + 1]);
                        closestDistance > dist && (closestDistance = dist, closestIndex = index)
                    }
                }), closestIndex
            },
            checkShiftKey: function(event) {
                this.ignoreRoads = event.shiftKey
            }
        })
    }, {
        "../helpers/geo": 9,
        "../libraries/leaflet": 11,
        "../libraries/leaflet-shift-patch": 10,
        "../libraries/leaflet.polylineDecorator": 12,
        "ampersand-app": 60,
        "ampersand-view": 157,
        "events-mixin": 176,
        underscore: 189
    }],
    36: [function(require, module) {
        var DirectionView = require("../views/leaflet-editable-direction"),
            DirectionToggleView = require("../views/direction-toggle"),
            View = require("ampersand-view"),
            ViewSwitcher = require("ampersand-view-switcher");
        module.exports = View.extend({
            insertSelf: !0,
            props: {
                switcher: "object"
            },
            initialize: function() {
                this.listenTo(this.model, "change:activeDirection", this.setDirection)
            },
            render: function() {
                this.switcher = new ViewSwitcher, this.registerSubview(this.switcher), this.setDirection();
                var directionToggle = new DirectionToggleView({
                    model: this.model
                });
                return document.body.appendChild(directionToggle.render().el), this.registerSubview(directionToggle), this
            },
            setDirection: function() {
                var view = new DirectionView({
                    model: this.model.activeDirection
                });
                this.switcher.set(view)
            }
        })
    }, {
        "../views/direction-toggle": 26,
        "../views/leaflet-editable-direction": 35,
        "ampersand-view": 157,
        "ampersand-view-switcher": 156
    }],
    37: [function(require, module) {
        var View = require("ampersand-view"),
            app = require("ampersand-app"),
            leaflet = require("../libraries/leaflet"),
            tinycolor = require("tinycolor2");
        module.exports = View.extend({
            insertSelf: !0,
            props: {
                polyline: "object"
            },
            initialize: function() {
                this.listenTo(this.model, "change:coordinates", this.updateCoordinates), this.listenTo(this.model.parent, "change:interfaceColor", this.updateColor), this.listenTo(this.model.parent, "change:isHidden", this.updateHidden), this.listenTo(app, "LINE_SELECT_COMPLETED", this.deemphasize), this.listenTo(app, "LINE_DESELECT_COMPLETED", this.emphasize)
            },
            render: function() {
                return this.polyline = leaflet.polyline(this.model.coordinates, {
                    color: this.model.parent.interfaceColor,
                    opacity: .5,
                    weight: 3,
                    className: "leafletLineDirection"
                }).addTo(leaflet.instance), this.polyline.on("click", this.select, this), this
            },
            select: function() {
                this.model.parent.activeDirection = this.model, app.trigger(app.actions.LINE_SELECT, {
                    lineId: this.model.parent.id
                })
            },
            updateCoordinates: function() {
                this.polyline.setLatLngs(this.model.coordinates)
            },
            updateColor: function() {
                this.polyline.setStyle({
                    color: this.model.parent.interfaceColor
                })
            },
            updateHidden: function() {
                this.model.parent.isHidden ? leaflet.instance.removeLayer(this.polyline) : leaflet.instance.addLayer(this.polyline)
            },
            emphasize: function() {
                this.polyline.setStyle({
                    weight: 3,
                    color: this.model.parent.interfaceColor
                })
            },
            deemphasize: function() {
                var isSelected = app.selectedLine === this.model.parent,
                    color = tinycolor(this.model.parent.color).desaturate(60).lighten(30).toString(),
                    weight = isSelected ? 9 : 2;
                this.polyline.setStyle({
                    weight: weight,
                    color: color
                })
            },
            remove: function() {
                this.polyline.off("click", this.select, this), leaflet.instance.removeLayer(this.polyline), View.prototype.remove.apply(this, arguments)
            }
        })
    }, {
        "../libraries/leaflet": 11,
        "ampersand-app": 60,
        "ampersand-view": 157,
        tinycolor2: 186
    }],
    38: [function(require, module) {
        var DirectionView = require("../views/leaflet-line-direction"),
            View = require("ampersand-view");
        module.exports = View.extend({
            insertSelf: !0,
            render: function() {
                var inbound = new DirectionView({
                    model: this.model.inbound
                });
                this.registerSubview(inbound).render();
                var outbound = new DirectionView({
                    model: this.model.outbound
                });
                return this.registerSubview(outbound).render(), this
            }
        })
    }, {
        "../views/leaflet-line-direction": 37,
        "ampersand-view": 157
    }],
    39: [function(require, module) {
        var CollectionView = require("ampersand-collection-view").extend({
                insertSelf: !0
            }),
            EditableLineView = require("../views/leaflet-editable"),
            LineView = require("../views/leaflet-line"),
            View = require("ampersand-view"),
            ViewSwitcher = require("ampersand-view-switcher"),
            app = require("ampersand-app"),
            config = require("../config"),
            leaflet = require("../libraries/leaflet");
        module.exports = View.extend({
            insertSelf: !0,
            props: {
                mapSwitcher: "object",
                lineSwitcher: "object",
                tiles: "object",
                viz: "object"
            },
            initialize: function() {
                this.listenTo(app, app.actions.MAP_SELECT_COMPLETED, this.showMap), this.listenTo(app, app.actions.MAP_DESELECT_COMPLETED, this.hideZoomButton), this.listenTo(app, app.actions.LINE_SELECT_COMPLETED, this.showLine), this.listenTo(app, app.actions.LINE_DESELECT_COMPLETED, this.hideLine), this.listenTo(app.state, "change:selectedLayer", this.updateTiles), this.listenTo(app.state, "change:selectedLayer", this.updateViz)
            },
            render: function() {
                return leaflet.instance = leaflet.map("leaflet-container", {
                    attributionControl: !1,
                    boxZoom: !1,
                    center: config.map.initialCenter,
                    doubleClickZoom: !1,
                    zoom: config.map.initialZoom
                }), this.mapSwitcher = new ViewSwitcher, this.lineSwitcher = new ViewSwitcher, this
            },
            renderTiles: function(tileUrl) {
                this.tiles = leaflet.tileLayer(tileUrl, {
                    detectRetina: !0
                }).addTo(leaflet.instance)
            },
            updateTiles: function() {
                var tileUrl = app.state.selectedLayer.tiles;
                this.tiles ? this.tiles._url !== tileUrl && this.tiles.setUrl(tileUrl) : this.renderTiles(tileUrl)
            },
            updateViz: function() {
                this.viz && leaflet.instance.removeLayer(this.viz);
                var layer = app.state.selectedLayer,
                    style = function(feature) {
                        for (var color, featureValue = feature.properties[layer.field], i = 0; i < layer.colors.length; i++)
                            if (featureValue < layer.cutoffs[i] || i === layer.colors.length - 1) {
                                color = layer.colors[i];
                                break
                            }
                        return {
                            color: color,
                            weight: "0px",
                            fillOpacity: .65,
                            cursor: "grab"
                        }
                    },
                    viz = leaflet.geoJson(layer.geoJSON, {
                        style: style
                    });
                this.viz = viz.addTo(leaflet.instance).bringToBack()
            },
            showMap: function() {
                var map = app.selectedMap,
                    view = new CollectionView({
                        collection: map.lines,
                        view: LineView
                    });
                this.mapSwitcher.set(view), leaflet.instance.setView(map.center, 14), leaflet.instance.zoomControl.addTo(leaflet.instance)
            },
            showLine: function() {
                var line = app.selectedLine,
                    view = new EditableLineView({
                        model: line
                    });
                this.lineSwitcher.set(view);
                var b1 = leaflet.latLngBounds(line.inbound.coordinates),
                    b2 = leaflet.latLngBounds(line.outbound.coordinates);
                b1.extend(b2), b1.isValid() && !leaflet.instance.getBounds().intersects(b1) && leaflet.instance.panTo(b1.getCenter())
            },
            hideLine: function() {
                this.lineSwitcher.clear()
            },
            hideZoomButton: function() {
                leaflet.instance.zoomControl && leaflet.instance.zoomControl.remove()
            }
        })
    }, {
        "../config": 7,
        "../libraries/leaflet": 11,
        "../views/leaflet-editable": 36,
        "../views/leaflet-line": 38,
        "ampersand-app": 60,
        "ampersand-collection-view": 106,
        "ampersand-view": 157,
        "ampersand-view-switcher": 156
    }],
    40: [function(require, module) {
        var ColorDotView = require("../views/color-dot"),
            View = require("ampersand-view"),
            app = require("ampersand-app"),
            config = require("../config"),
            multiline = require("multiline"),
            _ = require("underscore");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="my-maps-item">
                      <div class="my-maps-item-select" data-hook="select">
                        <div class="my-maps-item-city" data-hook="city"></div>
                        <div class="my-maps-item-name" data-hook="name"></div>
                      </div>
                      <div class="my-maps-item-more" data-hook="toggleActions"></div>
                      <div class="my-maps-item-actions" data-hook="actions">
                        <div class="my-maps-item-colors" data-hook="colorDots"></div>
                        <div class="my-maps-item-action" data-hook="duplicate">Copy map...</div>
                        <div class="my-maps-item-action" data-hook="destroy">Delete map...</div>
                      </div>
                    </div>
                  */
                console.log()
            }),
            props: {
                showingActions: {
                    type: "boolean",
                    "default": !1
                }
            },
            bindings: {
                "model.city": {
                    hook: "city"
                },
                "model.name": {
                    hook: "name"
                },
                "model.color": {
                    type: function() {
                        this.el.style.backgroundColor = this.model.color
                    }
                },
                showingActions: [{
                    type: "toggle",
                    hook: "actions"
                }, {
                    type: "booleanClass",
                    hook: "toggleActions",
                    name: "active"
                }]
            },
            events: {
                "click [data-hook=select]": "selectMap",
                "click [data-hook=toggleActions]": "toggleActions",
                "click [data-hook=duplicate]": "duplicateMap",
                "click [data-hook=destroy]": "destroyMap"
            },
            render: function() {
                return this.renderWithTemplate(this), _.each(config.defaults.colors, function(color) {
                    var view = new ColorDotView({
                        color: color,
                        model: this.model
                    });
                    this.renderSubview(view, this.queryByHook("colorDots"))
                }, this), this
            },
            selectMap: function() {
                app.trigger(app.actions.MAP_LOAD, {
                    mapId: this.model.id
                })
            },
            toggleActions: function() {
                this.showingActions = !this.showingActions, this.showingActions && this._hideActionsAfterClick()
            },
            _hideActionsAfterClick: function() {
                var self = this;
                setTimeout(function() {
                    document.addEventListener("click", function onClick() {
                        document.removeEventListener("click", onClick), self.showingActions = !1
                    })
                }, 1)
            },
            duplicateMap: function() {
                app.trigger(app.actions.MAP_DUPLICATE, {
                    mapId: this.model.id
                })
            },
            destroyMap: function() {
                app.trigger(app.actions.MAP_DESTROY, {
                    mapId: this.model.id
                })
            }
        })
    }, {
        "../config": 7,
        "../views/color-dot": 25,
        "ampersand-app": 60,
        "ampersand-view": 157,
        multiline: 182,
        underscore: 189
    }],
    41: [function(require, module) {
        var ItemView = require("../views/my-maps-item"),
            View = require("ampersand-view"),
            app = require("ampersand-app"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                      <div class="my-maps">
                        <div class="my-maps-create">
                          <div class="my-maps-create-title">City:</div>
                          <input class="dont-focus" data-hook="createMapInput" value="San Francisco">
                          <div data-hook="createMapButton" class="my-maps-create-button"><div></div></div>
                        </div>
                        <div data-hook="myMapsItems"></div>
                      </div>
                  */
                console.log()
            }),
            events: {
                "keyup [data-hook=createMapInput]": "captureEnter",
                "click [data-hook=createMapButton]": "createMap"
            },
            render: function() {
                this.renderWithTemplate(this), this.renderCollection(app.maps, ItemView, this.queryByHook("myMapsItems"));
                var input = this.queryByHook("createMapInput");
                return setTimeout(function() {
                    input.focus(), input.value = "San Francisco"
                }, 0), this
            },
            captureEnter: function(event) {
                13 === event.which && this.createMap()
            },
            createMap: function() {
                var city = this.queryByHook("createMapInput").value;
                app.trigger(app.actions.MAP_CREATE, {
                    city: city
                })
            }
        })
    }, {
        "../views/my-maps-item": 40,
        "ampersand-app": 60,
        "ampersand-view": 157,
        multiline: 182
    }],
    42: [function(require, module) {
        var View = require("ampersand-view"),
            WindowsView = require("../views/windows"),
            ColorDotView = require("../views/color-dot"),
            app = require("ampersand-app"),
            config = require("../config"),
            multiline = require("multiline"),
            tinycolor = require("tinycolor2"),
            _ = require("underscore");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="pane-line">
                      <div class="pane-line-back fixed-height">
                        <div class="pane-line-map-name" data-hook="back">Back</div>
                        <div class="pane-line-create" data-hook="create"></div>
                        <div class="pane-line-more" data-hook="toggleActions"></div>
                        <div class="pane-line-actions" data-hook="actions">
                          <div class="pane-line-colors" data-hook="colorDots"></div>
                          <div class="pane-line-action" data-hook="duplicate">Copy line...</div>
                          <div class="pane-line-action" data-hook="delete">Delete line...</div>
                        </div>
                        <div class="pane-line-expand" data-hook="toggleExpanded"></div>
                      </div>

                      <div class="pane-line-header fixed-height" data-hook="header">
                        <div class="pane-line-name-and-delete">
                          <input class="pane-line-name" data-hook="name">
                        </div>
                      </div>

                      <div data-hook="windows" class="scrollable"></div>

                      <div class="pane-line-stats fixed-height" data-hook="stats">
                        <div><span data-hook="distance"></span> <span class="pane-line-faded">&</span> <span data-hook="buses"></span></div>
                        <div data-hook="showServiceHours"><span data-hook="serviceHours"></span> hours <span class="pane-line-faded">/ yr</span></div>
                        <div data-hook="showCost"><span data-hook="cost"></span> <span class="pane-line-faded">/ yr</span></div>
                        <div><span data-hook="population"></span> people <span class="pane-line-faded">in .25 mi</span></div>
                        <div><span data-hook="poverty"></span> homes in poverty<span class="pane-line-faded"></span></div>
                      </div>
                    </div>
                  */
                console.log()
            }),
            props: {
                useCosting: "boolean",
                showingActions: {
                    type: "boolean",
                    "default": !1
                },
                isExpanded: {
                    type: "boolean",
                    "default": function() {
                        return app.state.isExpanded
                    }
                }
            },
            bindings: {
                isExpanded: {
                    type: "booleanClass",
                    name: "is-expanded"
                },
                "model.interfaceColor": {
                    type: function() {
                        var darker = tinycolor(this.model.interfaceColor).darken(10).toString(),
                            darkest = tinycolor(this.model.interfaceColor).darken(25).toString();
                        this.el.style.backgroundColor = darker, this.queryByHook("header").style.backgroundColor = this.model.interfaceColor, this.queryByHook("stats").style.backgroundColor = darkest
                    }
                },
                "model.name": {
                    hook: "name",
                    type: "value"
                },
                "model.readableDistance": {
                    hook: "distance"
                },
                "model.readableBuses": {
                    hook: "buses"
                },
                useCosting: {
                    type: "toggle",
                    no: "[data-hook=showServiceHours]",
                    yes: "[data-hook=showCost]"
                },
                "model.readableServiceHours": {
                    hook: "serviceHours"
                },
                "model.readableCost": {
                    hook: "cost"
                },
                "model.readablePopStat": {
                    hook: "population"
                },
                "model.readablePovertyStat": {
                    hook: "poverty"
                },
                showingActions: {
                    type: "toggle",
                    hook: "actions"
                }
            },
            events: {
                "click [data-hook=back]": "deselectLine",
                "click [data-hook=create]": "createLine",
                "click [data-hook=toggleExpanded]": "toggleExpanded",
                "blur [data-hook=name]": "setName",
                "click [data-hook=delete]": "deleteLine",
                "click [data-hook=duplicate]": "duplicateLine",
                "click [data-hook=toggleActions]": "toggleActions"
            },
            initialize: function() {
                var parentMap = this.model.collection.parent;
                this.useCosting = parentMap.useCosting, this.listenTo(parentMap, "change:useCosting", function() {
                    this.useCosting = parentMap.useCosting
                }), this.listenTo(app, app.actions.COLORS_DESATURATE, this.hideActions), this.listenTo(app.state, "change:isExpanded", function() {
                    this.isExpanded = app.state.isExpanded
                })
            },
            render: function() {
                return this.renderWithTemplate(this), this.renderSubview(new WindowsView({
                    collection: this.model.windows
                }), this.queryByHook("windows")), _.each(config.defaults.colors, function(color) {
                    var view = new ColorDotView({
                        color: color,
                        model: this.model
                    });
                    this.renderSubview(view, this.queryByHook("colorDots"))
                }, this), this
            },
            setName: function(event) {
                var name = event.target.value;
                return "" === name ? void(event.target.value = this.model.name) : void(this.model.name = name)
            },
            createLine: function() {
                app.trigger(app.actions.LINE_CREATE)
            },
            deselectLine: function() {
                app.trigger(app.actions.LINE_DESELECT)
            },
            duplicateLine: function() {
                app.trigger(app.actions.LINE_DUPLICATE, {
                    lineId: this.model.id
                }), this.showingActions = !1
            },
            deleteLine: function() {
                app.trigger(app.actions.LINE_DESTROY, {
                    lineId: this.model.id
                }), this.showingActions = !1
            },
            toggleExpanded: function() {
                app.state.isExpanded = !app.state.isExpanded
            },
            toggleActions: function() {
                this.showingActions = !this.showingActions, this.showingActions && this._hideActionsAfterClick()
            },
            _hideActionsAfterClick: function() {
                var self = this;
                setTimeout(function() {
                    document.addEventListener("click", function onClick() {
                        document.removeEventListener("click", onClick), self.showingActions = !1
                    })
                }, 1)
            }
        })
    }, {
        "../config": 7,
        "../views/color-dot": 25,
        "../views/windows": 58,
        "ampersand-app": 60,
        "ampersand-view": 157,
        multiline: 182,
        tinycolor2: 186,
        underscore: 189
    }],
    43: [function(require, module) {
        var View = require("ampersand-view"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="pane-map-empty">Give this map a name, and then add a line with the <span class="pane-map-empty-icon">+</span> button.</div>
                  */
                console.log()
            })
        })
    }, {
        "ampersand-view": 157,
        multiline: 182
    }],
    44: [function(require, module) {
        var View = require("ampersand-view"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div>
                      <div class="pane-map-filter-button" data-hook="toggleFilters"></div>
                      <div data-hook="filters" class="pane-map-filters">
                        <div class="pane-map-filter-action" data-hook="filterToAll">All</div>
                        <div class="pane-map-filter-action" data-hook="filterToHighFreq">
                          <div>High Frequency</div>
                          <div class="filter-description">15 min or better, weekdays at noon</div>
                        </div>
                        <div class="pane-map-filter-action" data-hook="filterToLowFreq">Low Frequency</div>
                      </div>
                    </div>
                  */
                console.log()
            }),
            props: {
                showingFilters: {
                    type: "boolean",
                    "default": !1
                }
            },
            events: {
                "click [data-hook=toggleFilters]": "toggleFilters",
                "click [data-hook=filterToAll]": "filterToAll",
                "click [data-hook=filterToHighFreq]": "filterToHighFreq",
                "click [data-hook=filterToLowFreq]": "filterToLowFreq"
            },
            bindings: {
                showingFilters: [{
                    type: "toggle",
                    hook: "filters"
                }, {
                    type: "booleanClass",
                    name: "showing-filters"
                }]
            },
            render: function() {
                return this.renderWithTemplate(this), this
            },
            filterToAll: function() {
                this.model.lines.forEach(function(line) {
                    line.isHidden = !1
                })
            },
            filterToHighFreq: function() {
                this.model.lines.forEach(function(line) {
                    line.isHidden = !line.isHighFrequency
                })
            },
            filterToLowFreq: function() {
                this.model.lines.forEach(function(line) {
                    line.isHidden = line.isHighFrequency
                })
            },
            toggleFilters: function() {
                this.showingFilters = !this.showingFilters, this.showingFilters && this._hideFiltersAfterClick()
            },
            _hideFiltersAfterClick: function() {
                var self = this;
                setTimeout(function() {
                    document.addEventListener("click", function onClick() {
                        document.removeEventListener("click", onClick), self.showingFilters = !1
                    })
                }, 1)
            }
        })
    }, {
        "ampersand-view": 157,
        multiline: 182
    }],
    45: [function(require, module) {
        var View = require("ampersand-view"),
            app = require("ampersand-app"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="pane-map-item">
                      <div class="pane-map-item-name" data-hook="select">
                        <span data-hook="lineName"></span>
                      </div>
                      <div class="pane-map-item-hide" data-hook="hide"></div>
                    </div>
                  */
                console.log()
            }),
            bindings: {
                "model.name": {
                    hook: "lineName"
                },
                "model.interfaceColor": {
                    type: function() {
                        this.updateColor()
                    }
                },
                "model.isHidden": [{
                    type: "booleanClass",
                    name: "hidden"
                }, {
                    type: function() {
                        this.updateColor()
                    }
                }]
            },
            events: {
                "click [data-hook=select]": "selectLine",
                "click [data-hook=hide]": "hide"
            },
            updateColor: function() {
                this.el.style.backgroundColor = this.model.isHidden ? "#bbb" : this.model.interfaceColor
            },
            hide: function() {
                this.model.isHidden = !this.model.isHidden
            },
            selectLine: function() {
                this.model.isHidden || app.trigger(app.actions.LINE_SELECT, {
                    lineId: this.model.id
                })
            }
        })
    }, {
        "ampersand-app": 60,
        "ampersand-view": 157,
        multiline: 182
    }],
    46: [function(require, module) {
        var CollectionView = require("ampersand-collection-view"),
            EmptyView = require("../views/pane-map-empty"),
            FilterView = require("../views/pane-map-filter"),
            ItemView = require("../views/pane-map-item"),
            View = require("ampersand-view"),
            app = require("ampersand-app"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="pane-map">
                      <div class="pane-map-toolbar fixed-height">
                        <div class="pane-map-city" data-hook="city"></div>
                        <div data-hook="filter"></div>
                        <div class="pane-map-create" data-hook="create"></div>
                        <div class="pane-map-expand" data-hook="toggleExpand"></div>
                      </div>
                      <div class="pane-map-header fixed-height">
                        <input class="pane-map-name" data-hook="name">
                      </div>
                      <div data-hook="lines" class="scrollable"></div>
                      <div class="pane-map-stats fixed-height">
                        <div><span data-hook="count"></span> lines <span class="pane-map-faded">&</span> <span data-hook="buses"></span> buses</div>
                        <div data-hook="showServiceHours"><span data-hook="serviceHours"></span> hours <span class="pane-map-faded">/ yr</span></div>
                        <div data-hook="showCost"><span data-hook="cost"></span> <span class="pane-line-faded">/ yr</span></div>
                      </div>
                    </div>
                  */
                console.log()
            }),
            props: {
                isExpanded: {
                    type: "boolean",
                    "default": function() {
                        return app.state.isExpanded
                    }
                }
            },
            bindings: {
                isExpanded: {
                    type: "booleanClass",
                    name: "is-expanded"
                },
                "model.city": {
                    hook: "city"
                },
                "model.name": {
                    hook: "name",
                    type: "value"
                },
                "model.buses": {
                    hook: "buses"
                },
                "model.count": {
                    hook: "count"
                },
                "model.useCosting": {
                    type: "toggle",
                    no: "[data-hook=showServiceHours]",
                    yes: "[data-hook=showCost]"
                },
                "model.readableServiceHours": {
                    hook: "serviceHours"
                },
                "model.readableCost": {
                    hook: "cost"
                }
            },
            events: {
                "blur [data-hook=name]": "setName",
                "click [data-hook=create]": "createLine",
                "click [data-hook=toggleExpand]": "toggleExpand"
            },
            initialize: function() {
                this.listenTo(app.state, "change:isExpanded", function() {
                    this.isExpanded = app.state.isExpanded
                })
            },
            render: function() {
                this.renderWithTemplate(this);
                var view = new CollectionView({
                    collection: this.model.lines,
                    view: ItemView,
                    emptyView: EmptyView,
                    el: this.queryByHook("lines")
                }).render();
                this.registerSubview(view);
                var filterView = new FilterView({
                    model: this.model
                });
                return this.renderSubview(filterView, this.queryByHook("filter")), this
            },
            setName: function(event) {
                var name = event.target.value;
                return "" === name ? void(event.target.value = this.model.name) : void(this.model.name = name)
            },
            createLine: function() {
                app.trigger(app.actions.LINE_CREATE)
            },
            toggleExpand: function() {
                app.state.isExpanded = !app.state.isExpanded
            }
        })
    }, {
        "../views/pane-map-empty": 43,
        "../views/pane-map-filter": 44,
        "../views/pane-map-item": 45,
        "ampersand-app": 60,
        "ampersand-collection-view": 106,
        "ampersand-view": 157,
        multiline: 182
    }],
    47: [function(require, module) {
        var LineView = require("../views/pane-line"),
            MapView = require("../views/pane-map"),
            View = require("ampersand-view"),
            ViewSwitcher = require("ampersand-view-switcher"),
            app = require("ampersand-app"),
            multiline = require("multiline"),
            _ = require("underscore");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div>
                      <div data-hook="map"></div> 
                      <div data-hook="line"></div>      
                    </div>
                  */
                console.log()
            }),
            props: {
                mapSwitcher: "object",
                lineSwitcher: "object"
            },
            initialize: function() {
                this.listenTo(app, app.actions.MAP_SELECT_COMPLETED, this.showMapPane), this.listenTo(app, app.actions.MAP_DESELECT_COMPLETED, this.hideBothPanes), this.listenTo(app, app.actions.LINE_SELECT_COMPLETED, this.showLinePane), this.listenTo(app, app.actions.LINE_DESELECT_COMPLETED, this.hideLinePane), this.listenTo(app, app.actions.COLORS_DESATURATE, this.desaturate), this.listenTo(app, app.actions.COLORS_SATURATE, this.saturate), this.listenTo(app.state, "change:isExpanded", this.afterExpand)
            },
            render: function() {
                this.renderWithTemplate(this);
                var afterSwitch = _.bind(this.afterSwitch, this);
                return this.mapSwitcher = new ViewSwitcher(this.queryByHook("map"), {
                    show: afterSwitch
                }), this.lineSwitcher = new ViewSwitcher(this.queryByHook("line"), {
                    show: afterSwitch
                }), this
            },
            afterSwitch: function(newView) {
                var fixed = newView.queryAll(".fixed-height"),
                    scrollable = newView.query(".scrollable");
                this.configureScrolling(fixed, scrollable)
            },
            afterExpand: function() {
                var fixed = document.querySelectorAll(".fixed-height"),
                    scrollable = document.querySelector(".scrollable");
                this.configureScrolling(fixed, scrollable)
            },
            configureScrolling: function(fixedHeightViews, scrollableView) {
                var fixedHeight = 0;
                _.each(fixedHeightViews, function(view) {
                    fixedHeight += view.clientHeight
                });
                var margin = app.state.isExpanded ? 5 : 15,
                    scrollHeight = document.querySelector(".main-app").clientHeight - fixedHeight - 2 * margin;
                scrollableView.style.maxHeight = scrollHeight + "px"
            },
            desaturate: function() {
                this.el.classList.add("desaturated")
            },
            saturate: function() {
                this.el.classList.remove("desaturated")
            },
            showMapPane: function() {
                var map = app.selectedMap;
                this.mapSwitcher.set(new MapView({
                    model: map
                }))
            },
            hideMapPane: function() {
                this.mapSwitcher.clear()
            },
            showLinePane: function() {
                this.hideMapPane();
                var line = app.selectedLine;
                this.lineSwitcher.set(new LineView({
                    model: line
                }))
            },
            hideLinePane: function() {
                this.lineSwitcher.clear(), this.showMapPane()
            },
            hideBothPanes: function() {
                this.mapSwitcher.clear(), this.lineSwitcher.clear()
            }
        })
    }, {
        "../views/pane-line": 42,
        "../views/pane-map": 46,
        "ampersand-app": 60,
        "ampersand-view": 157,
        "ampersand-view-switcher": 156,
        multiline: 182,
        underscore: 189
    }],
    48: [function(require, module) {
        var View = require("ampersand-view"),
            app = require("ampersand-app"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div>
                      <div class="permissions-text">This map belongs to another person. Any changes won't be saved.</div>
                      <div class="permissions-buttons">
                        <div data-hook="duplicate" class="permissions-action long">Make a copy...</div>
                      </div>
                    </div>
                  */
                console.log()
            }),
            events: {
                "click [data-hook=duplicate]": "duplicate"
            },
            duplicate: function() {
                app.trigger(app.actions.MAP_DUPLICATE, {
                    mapId: app.selectedMap.id
                })
            }
        })
    }, {
        "ampersand-app": 60,
        "ampersand-view": 157,
        multiline: 182
    }],
    49: [function(require, module) {
        var View = require("ampersand-view"),
            app = require("ampersand-app"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div>
                      <div class="permissions-text">This map is powered by Transitmix Pro. <a href="http://transitmix.net" target="_blank">Learn more...</a></div>
                      <div class="permissions-buttons">
                        <div data-hook="requestInvite" class="permissions-action">Request Invite</div><div data-hook="login" class="permissions-action">Login</div>
                      </div>
                    </div>
                  */
                console.log()
            }),
            events: {
                "click [data-hook=requestInvite]": "requestInvite",
                "click [data-hook=login]": "login"
            },
            requestInvite: function() {
                window.open("https://transitmix.wufoo.com/forms/request-a-transitmix-pro-invite/def/field19=" + app.selectedMap.id, "_blank")
            },
            login: function() {
                window.location.href = "/users/sign_in"
            }
        })
    }, {
        "ampersand-app": 60,
        "ampersand-view": 157,
        multiline: 182
    }],
    50: [function(require, module) {
        var View = require("ampersand-view"),
            multiline = (require("ampersand-app"), require("multiline"));
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div>
                      <div class="permissions-text">Want to use Transitmix Pro in your city? <a href="https://transitmix.wufoo.com/forms/use-transitmix-pro-in-your-city/" target="_blank">Click here...</a></div>
                      <div class="permissions-buttons">
                        <div data-hook="signup" class="permissions-action long">I want Transitmix!</div>
                      </div>
                    </div>
                  */
                console.log()
            }),
            events: {
                "click [data-hook=signup]": "signup"
            },
            signup: function() {
                window.open("https://transitmix.wufoo.com/forms/use-transitmix-pro-in-your-city/", "_blank")
            }
        })
    }, {
        "ampersand-app": 60,
        "ampersand-view": 157,
        multiline: 182
    }],
    51: [function(require, module) {
        var ExistingUserView = require("../views/permissions-existing"),
            NewUserView = require("../views/permissions-new"),
            SandboxView = require("../views/permissions-sandbox"),
            View = require("ampersand-view"),
            app = require("ampersand-app"),
            dom = require("ampersand-dom"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="permissions" data-hook="permissionsContent"></div>
                  */
                console.log()
            }),
            props: {
                subview: "object",
                visible: {
                    type: "boolean",
                    "default": !1
                }
            },
            bindings: {
                visible: {
                    type: "toggle"
                }
            },
            initialize: function() {
                this.listenTo(app, app.actions.MAP_SELECT_COMPLETED, this.togglePermissions), this.listenTo(app, app.actions.MAP_DESELECT_COMPLETED, this.togglePermissions), this.listenTo(app, app.actions.SANDBOX_START, this.renderSandbox)
            },
            render: function() {
                return this.renderWithTemplate(this), this.subview = app.user ? this.renderSubview(new ExistingUserView, this.queryByHook("permissionsContent")) : this.renderSubview(new NewUserView, this.queryByHook("permissionsContent")), this
            },
            togglePermissions: function() {
                !app.user || app.selectedMap && app.selectedMap.authorId !== app.user.id ? (this.visible = !0, dom.addClass(document.body, "showing-permissions")) : (this.visible = !1, dom.removeClass(document.body, "showing-permissions"))
            },
            renderSandbox: function() {
                this.subview && this.subview.remove(), this.visible = !0, dom.addClass(document.body, "showing-permissions"), this.renderSubview(new SandboxView, this.queryByHook("permissionsContent"))
            }
        })
    }, {
        "../views/permissions-existing": 48,
        "../views/permissions-new": 49,
        "../views/permissions-sandbox": 50,
        "ampersand-app": 60,
        "ampersand-dom": 116,
        "ampersand-view": 157,
        multiline: 182
    }],
    52: [function(require, module) {
        var View = require("ampersand-view"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="sandbox">
                      <h1>Welcome to Transitmix Pro</h1>
                      <div class="description">
                        <p>A fast & simple way to sketch and cost out changes to your transit network. A few things to try:</p>
                        <ul>
                          <li>Draw a new bus line.</li>
                          <li>Overlay census data.</li>
                          <li>Adjust the cost calculations.</li>
                        </ul>
                      </div>
                      <div class="sandbox-action">Start Now</div>
                    </div>
                  */
                console.log()
            })
        })
    }, {
        "ampersand-view": 157,
        multiline: 182
    }],
    53: [function(require, module) {
        var View = require("ampersand-view"),
            WindowsView = require("../views/windows"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="settings">
                      <section>
                        <h1>Costs</h1>
                        <div class="settings-field-checkbox" data-hook="useCosting"><span class="settings-checkbox" data-hook="costingCheckbox"></span> Estimate Dollar Costs</div>
                        <div class="settings-field"><input data-hook="costPerHour"><label>per hour</label></div>
                        <div class="settings-field"><input data-hook="costPerBus"><label>per bus</label></div>
                        <div class="settings-field"><input data-hook="costPerDistance"><label data-hook="usingMetric">per km</label><label data-hook="usingStandard">per mile</label></div>
                      </section>

                      <section>
                        <h1>
                          <div>Layover</div>
                          <div class="settings-layover-button" data-hook="toggleRules"></div>
                          <div class="settings-layover-rules" data-hook="rules">
                            <div class="settings-layover-rule" data-hook="enableACTransit"><span class="rule-label">Add Rule:</span> Use a 12 minute layover for trips longer than 60 minutes.</div>
                          </div>
                        </h1>
                        <div class="settings-field"><input data-hook="layoverPercentage"><label>per trip</label></div>
                        <div class="settings-field"><input data-hook="layoverMinimum"><label>minimum</label></div>
                        <div class="settings-rule-field" data-hook="actransit">
                          <div><span class="rule-label">Rule:</span> Use a 12 minute layover for trips longer than 60 minutes.</div>
                          <div class="settings-rule-remove" data-hook="disableACTransit"></div>
                        </div>
                      </section>

                      <section>
                        <h1>Calendar</h1>
                        <div class="settings-field"><input data-hook="serviceWeekdays"><label>weekdays</label></div>
                        <div class="settings-field"><input data-hook="serviceSaturdays"><label>saturdays</label></div>
                        <div class="settings-field"><input data-hook="serviceSundays"><label>sundays</label></div>
                      </section>

                      <section>
                        <h1>Schedule for New Lines</h1>
                        <div data-hook="defaultWindows"></div>
                      </section>
                    </div>
                  */
                console.log()
            }),
            props: {
                showingRules: {
                    type: "boolean",
                    "default": !1
                }
            },
            bindings: {
                "model.useCosting": {
                    hook: "costingCheckbox",
                    type: "booleanClass",
                    name: "checked"
                },
                "model.serviceSaturdays": {
                    hook: "serviceSaturdays",
                    type: "value"
                },
                "model.serviceSundays": {
                    hook: "serviceSundays",
                    type: "value"
                },
                "model.serviceWeekdays": {
                    hook: "serviceWeekdays",
                    type: "value"
                },
                "model.readableLayoverPercentage": {
                    hook: "layoverPercentage",
                    type: "value"
                },
                "model.readableLayoverMinimum": {
                    hook: "layoverMinimum",
                    type: "value"
                },
                "model.layoverForACTransit": {
                    type: "toggle",
                    hook: "actransit"
                },
                showingRules: {
                    type: "toggle",
                    hook: "rules"
                },
                "model.readableCostPerBus": {
                    hook: "costPerBus",
                    type: "value"
                },
                "model.readableCostPerHour": {
                    hook: "costPerHour",
                    type: "value"
                },
                "model.readableCostPerDistance": {
                    hook: "costPerDistance",
                    type: "value"
                },
                "model.useMetricUnits": {
                    type: "toggle",
                    yes: "[data-hook=usingMetric]",
                    no: "[data-hook=usingStandard]"
                }
            },
            events: {
                "click [data-hook=toggleRules]": "toggleRules",
                "click [data-hook=useCosting]": "toggleCosting",
                "click [data-hook=enableACTransit]": "enableACTransit",
                "click [data-hook=disableACTransit]": "disableACTransit",
                "blur [data-hook=serviceSaturdays]": "setSaturdays",
                "blur [data-hook=serviceSundays]": "setSundays",
                "blur [data-hook=serviceWeekdays]": "setWeekdays",
                "blur [data-hook=layoverPercentage]": "setLayoverPercentage",
                "blur [data-hook=layoverMinimum]": "setLayoverMinimum",
                "blur [data-hook=costPerBus]": "setCostPerBus",
                "blur [data-hook=costPerHour]": "setCostPerHour",
                "blur [data-hook=costPerDistance]": "setCostPerDistance"
            },
            render: function() {
                this.renderWithTemplate(this);
                var windowsView = new WindowsView({
                    collection: this.model.defaultWindows
                });
                return this.renderSubview(windowsView, this.queryByHook("defaultWindows")), this
            },
            toggleCosting: function() {
                this.model.useCosting = !this.model.useCosting
            },
            setSaturdays: function(event) {
                var days = parseInt(event.target.value, 10);
                return isNaN(days) || 0 > days ? void(event.target.value = this.model.serviceSaturdays) : void(this.model.serviceSaturdays = days)
            },
            setSundays: function(event) {
                var days = parseInt(event.target.value, 10);
                return isNaN(days) || 0 > days ? void(event.target.value = this.model.serviceSundays) : void(this.model.serviceSundays = days)
            },
            setWeekdays: function(event) {
                var days = parseInt(event.target.value, 10);
                return isNaN(days) || 0 > days ? void(event.target.value = this.model.serviceWeekdays) : void(this.model.serviceWeekdays = days)
            },
            setLayoverPercentage: function(event) {
                var percentage = parseInt(event.target.value, 10) / 100;
                return isNaN(percentage) || 0 > percentage || percentage > 1 ? void(event.target.value = this.model.readableLayoverPercentage) : void(this.model.layoverPercentage = percentage)
            },
            setLayoverMinimum: function(event) {
                var minimum = parseInt(event.target.value, 10);
                return isNaN(minimum) || 0 > minimum ? void(event.target.value = this.model.readableLayoverMinimum) : void(this.model.layoverMinimum = minimum)
            },
            setCostPerBus: function(event) {
                var cost = this._parseFloat(event.target.value);
                return isNaN(cost) || 0 > cost ? void(event.target.value = this.model.readableCostPerBus) : void(this.model.costPerBus = cost)
            },
            setCostPerHour: function(event) {
                var cost = this._parseFloat(event.target.value);
                return isNaN(cost) || 0 > cost ? void(event.target.value = this.model.readableCostPerHour) : void(this.model.costPerHour = cost)
            },
            setCostPerDistance: function(event) {
                var cost = this._parseFloat(event.target.value);
                return isNaN(cost) || 0 > cost ? void(event.target.value = this.model.readableCostPerDistance) : (this.model.useMetricUnits || (cost /= 1.609344), void(this.model.costPerKm = cost))
            },
            _parseFloat: function(str) {
                return parseFloat(str.replace(/[^0-9-.]/g, ""))
            },
            toggleRules: function() {
                this.showingRules = !this.showingRules, this.showingRules && this._hideAfterClick()
            },
            _hideAfterClick: function() {
                var self = this;
                setTimeout(function() {
                    document.addEventListener("click", function onClick() {
                        document.removeEventListener("click", onClick), self.showingRules = !1
                    })
                }, 1)
            },
            enableACTransit: function() {
                this.model.layoverForACTransit = !0
            },
            disableACTransit: function() {
                this.model.layoverForACTransit = !1
            }
        })
    }, {
        "../views/windows": 58,
        "ampersand-view": 157,
        multiline: 182
    }],
    54: [function(require, module) {
        var View = require("ampersand-view"),
            app = require("ampersand-app"),
            analytics = require("../helpers/analytics"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="share">
                      <section>
                        <h1>Share</h1>
                        <div><input data-hook="shareUrl"></div>
                        <div class="share-description">To share this map, send people this link. They can view it or make a copy. Your version will always be safe.</div>
                      </section>
                      <section>
                        <h1>Export</h1>
                        <div class="share-action" data-hook="downloadXLS">Download as Excel...</div>
                        <div class="share-action" data-hook="downloadKML">Download as KML...</div>
                        <div class="share-action" data-hook="downloadShapefile">Download as shapefile...</div>
                        <div class="share-action" data-hook="downloadGTFS">Download as GTFS...</div>
                      </section>
                    </div>
                  */
                console.log()
            }),
            props: {
                mapFrag: "string",
                mapUrl: "string",
                clickedGTFS: {
                    type: "boolean",
                    "default": !1
                }
            },
            initialize: function() {
                window.location.origin || (window.location.origin = window.location.protocol + "//" + window.location.host), this.mapFrag = "/map/" + app.selectedMap.id, this.mapUrl = window.location.origin + this.mapFrag
            },
            render: function() {
                this.renderWithTemplate(this);
                var input = this.queryByHook("shareUrl");
                return input.value = this.mapUrl, setTimeout(function() {
                    input.focus()
                }, 0), this
            },
            events: {
                "click [data-hook=downloadXLS]": "downloadXLS",
                "click [data-hook=downloadKML]": "downloadKML",
                "click [data-hook=downloadShapefile]": "downloadShapefile",
                "click [data-hook=downloadGTFS]": "downloadGTFS"
            },
            downloadXLS: function() {
                window.location.href = this.mapUrl + ".xls", analytics.trackPage(this.mapFrag + ".xls")
            },
            downloadKML: function() {
                window.location.href = this.mapUrl + ".kml", analytics.trackPage(this.mapFrag + ".kml")
            },
            downloadShapefile: function() {
                window.location.href = this.mapUrl + ".zip", analytics.trackPage(this.mapFrag + ".zip")
            },
            downloadGTFS: function() {
                this.clickedGTFS || (this.clickedGTFS = !0, window.location.href = this.mapUrl + ".zip?gtfs=true", analytics.trackPage(this.mapFrag + ".zip?gtfs=true"))
            }
        })
    }, {
        "../helpers/analytics": 8,
        "ampersand-app": 60,
        "ampersand-view": 157,
        multiline: 182
    }],
    55: [function(require, module) {
        var HelpView = require("../views/help"),
            ImportView = require("../views/import"),
            LayersView = require("../views/layers"),
            MyMapsView = require("../views/my-maps"),
            SandboxView = require("../views/sandbox"),
            SettingsView = require("../views/settings"),
            ShareView = require("../views/share"),
            View = require("ampersand-view"),
            ViewSwitcher = require("ampersand-view-switcher"),
            app = require("ampersand-app"),
            dom = require("ampersand-dom"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div>
                      <div class="sidebar">
                        <div class="sidebar-button sidebar-button-maps" data-hook="maps"><div></div></div>
                        <div class="sidebar-button sidebar-button-sandbox" data-hook="sandbox" style="display:none"><div></div></div>
                        <div class="sidebar-bottom">
                          <div class="sidebar-button sidebar-button-layers" data-hook="layers"><div></div></div>
                          <div class="sidebar-button sidebar-button-settings" data-hook="settings"><div></div></div>
                          <div class="sidebar-button sidebar-button-import" data-hook="import"><div></div></div>
                          <div class="sidebar-button sidebar-button-share" data-hook="share"><div></div></div>
                          <div class="sidebar-button sidebar-button-help" data-hook="help"><div></div></div>
                        </div>
                      </div>
                      
                      <div class="sidebar-tab" data-hook="tab"></div>
                    </div>
                  */
                console.log()
            }),
            props: {
                visible: ["boolean", !0, !1],
                selectedTab: {
                    type: "string",
                    values: ["", "maps", "layers", "settings", "import", "share", "help", "sandbox"],
                    "default": ""
                },
                switcher: "object"
            },
            events: {
                "click [data-hook=maps]": "toggleMaps",
                "click [data-hook=layers]": "toggleLayers",
                "click [data-hook=settings]": "toggleSettings",
                "click [data-hook=import]": "toggleImport",
                "click [data-hook=share]": "toggleShare",
                "click [data-hook=help]": "toggleHelp",
                "click [data-hook=sandbox]": "toggleSandbox",
                "click [data-hook=tab]": "dismissTab"
            },
            bindings: {
                visible: {
                    type: "toggle"
                },
                selectedTab: [{
                    type: "switchClass",
                    name: "is-active",
                    cases: {
                        maps: "[data-hook=maps]",
                        layers: "[data-hook=layers]",
                        settings: "[data-hook=settings]",
                        "import": "[data-hook=import]",
                        share: "[data-hook=share]",
                        help: "[data-hook=help]",
                        sandbox: "[data-hook=sandbox]"
                    }
                }, {
                    type: "toggle",
                    hook: "tab"
                }]
            },
            toggleMaps: function() {
                this._toggle("maps", MyMapsView)
            },
            toggleLayers: function() {
                this._toggle("layers", LayersView)
            },
            toggleSettings: function() {
                this._toggle("settings", SettingsView, {
                    model: app.selectedMap
                })
            },
            toggleImport: function() {
                this._toggle("import", ImportView, {
                    collection: app.nearbyAgencies
                })
            },
            toggleShare: function() {
                this._toggle("share", ShareView)
            },
            toggleHelp: function() {
                this._toggle("help", HelpView)
            },
            toggleSandbox: function() {
                this._toggle("sandbox", SandboxView, {
                    hideTab: this.hideTab
                })
            },
            initialize: function() {
                this.listenTo(app, app.actions.MAP_SELECT_COMPLETED, this.hideTab), this.listenTo(app, app.actions.MAP_SELECT_COMPLETED, function() {
                    this.visible = !0
                }), this.listenTo(app, app.actions.MAP_DESELECT_COMPLETED, function() {
                    this.visible = !1
                }), this.listenTo(app, app.actions.SANDBOX_START, this.renderSandbox)
            },
            render: function() {
                return this.renderWithTemplate(this), this.switcher = new ViewSwitcher(this.queryByHook("tab")), app.user || dom.hide(this.queryByHook("maps")), this
            },
            _toggle: function(key, view, options) {
                this.queryByHook("tab").scrollTop = 0, this.selectedTab === key ? this.hideTab() : (this.switcher.set(new view(options)), this.selectedTab = key, app.trigger(app.actions.COLORS_DESATURATE))
            },
            hideTab: function() {
                this.switcher.clear(), this.selectedTab = "", app.trigger(app.actions.COLORS_SATURATE)
            },
            dismissTab: function(event) {
                this.queryByHook("tab") === event.target && this.hideTab(), "sandbox" === this.selectedTab && this.hideTab()
            },
            renderSandbox: function() {
                dom.hide(this.queryByHook("maps")), dom.show(this.queryByHook("sandbox")), this.toggleSandbox()
            }
        })
    }, {
        "../views/help": 27,
        "../views/import": 32,
        "../views/layers": 34,
        "../views/my-maps": 41,
        "../views/sandbox": 52,
        "../views/settings": 53,
        "../views/share": 54,
        "ampersand-app": 60,
        "ampersand-dom": 116,
        "ampersand-view": 157,
        "ampersand-view-switcher": 156,
        multiline: 182
    }],
    56: [function(require, module) {
        var View = require("ampersand-view"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="window-item">
                      <input data-hook="start"    class="column-start">
                      <input data-hook="end"      class="column-end">
                      <input data-hook="headway"  class="column-headway">
                      <input data-hook="runtime"  class="column-runtime">
                      <input data-hook="layover"  class="column-layover disabled"  disabled="disabled">
                      <input data-hook="speed"    class="column-speed">
                      <input data-hook="buses" class="column-buses disabled" disabled="disabled">
                      <input data-hook="wiggle"   class="column-wiggle disabled" disabled="disabled">
                    </div>
                  */
                console.log()
            }),
            bindings: {
                "model.readableStart": {
                    type: "value",
                    hook: "start"
                },
                "model.readableEnd": {
                    type: "value",
                    hook: "end"
                },
                "model.readableHeadway": {
                    type: "value",
                    hook: "headway"
                },
                "model.readableRuntime": {
                    type: "value",
                    hook: "runtime"
                },
                "model.readableLayover": {
                    type: "value",
                    hook: "layover"
                },
                "model.readableSpeed": {
                    type: "value",
                    hook: "speed"
                },
                "model.readableBuses": {
                    type: "value",
                    hook: "buses"
                },
                "model.readableWiggle": {
                    type: "value",
                    hook: "wiggle"
                }
            },
            events: {
                "blur [data-hook=start]": "setStart",
                "blur [data-hook=end]": "setEnd",
                "blur [data-hook=headway]": "setHeadway",
                "blur [data-hook=runtime]": "setRuntime",
                "blur [data-hook=speed]": "setSpeed"
            },
            setStart: function(event) {
                var time = this._readTime(event.target.value);
                return isNaN(time) || this.model.start === time ? void(event.target.value = this.model.readableStart) : void(this.model.start = time)
            },
            setEnd: function(event) {
                var time = this._readTime(event.target.value);
                return isNaN(time) || this.model.end === time ? void(event.target.value = this.model.readableEnd) : void(this.model.end = time)
            },
            setHeadway: function(event) {
                var headway = parseInt(event.target.value, 10);
                return isNaN(headway) || 0 >= headway || this.model.headway === headway ? void(event.target.value = this.model.readableHeadway) : void(this.model.headway = headway)
            },
            setSpeed: function(event) {
                var speed = parseFloat(event.target.value),
                    map = this.model.collection.parent;
                return "map" !== map.getType() && (map = map.collection.parent), map.useMetricUnits || (speed = 1.60934 * speed), speed = parseFloat(speed.toFixed(1)), isNaN(speed) || 0 >= speed || this.model.speed === speed ? void(event.target.value = this.model.readableSpeed) : void(this.model.speed = speed)
            },
            setRuntime: function(event) {
                var runtime = parseFloat(event.target.value) / 60,
                    length = this.model.collection.parent.meters / 1e3,
                    speed = length / runtime;
                return isNaN(runtime) || 0 >= runtime || 0 === length || this.model.speed === speed ? void(event.target.value = this.model.readableRuntime) : void(this.model.speed = speed)
            },
            _readTime: function(time) {
                if ("noon" === time) return 720;
                if ("midnight" === time) return 0;
                var minutes, hours, parsed = parseInt(time, 10);
                time.indexOf(":") > -1 ? (hours = parseInt(time.split(":")[0], 10), minutes = parseInt(time.split(":")[1], 10)) : 24 >= parsed ? (hours = parsed, minutes = 0) : (hours = parseInt(parsed / 100), minutes = parsed % 100);
                var isAM = time.indexOf("a") > -1,
                    isPM = time.indexOf("p") > -1,
                    isNoon = isPM && 12 === hours,
                    isMidnight = isAM && 12 === hours;
                return isPM && !isNoon && (hours += 12), isMidnight && (hours -= 12), hours %= 24, minutes %= 60, 60 * hours + minutes
            }
        })
    }, {
        "ampersand-view": 157,
        multiline: 182
    }],
    57: [function(require, module) {
        var Subcollection = require("ampersand-subcollection"),
            View = require("ampersand-view"),
            WindowsItemView = require("../views/windows-item"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="windows-section">
                      <div class="windows-header">
                        <span data-hook="sectionName"></span>
                        <div class="windows-actions">
                          <div class="windows-remove" data-hook="remove"></div><div class="windows-add" data-hook="add"></div>
                        </div>
                      </div>
                      <div class="windows-columns">
                        <div class="column-start">From</div>
                        <div class="column-end">To</div>
                        <div class="column-headway">Every</div>
                        <div class="column-runtime">Runtime</div>
                        <div class="column-layover">Layover</div>
                        <div class="column-speed">Speed</div>
                        <div class="column-buses">Buses</div>
                        <div class="column-wiggle">Wiggle</div>
                      </div>
                      <div data-hook="windows-items"></div>
                    </div>
                  */
                console.log()
            }),
            props: {
                subcollection: "object",
                sectionName: "string",
                filter: "object"
            },
            bindings: {
                sectionName: {
                    hook: "sectionName"
                }
            },
            events: {
                "click [data-hook=add]": "addWindow",
                "click [data-hook=remove]": "removeWindow"
            },
            initialize: function(options) {
                this.filter = options.filter, this.sectionName = options.sectionName, this.subcollection = new Subcollection(this.collection, {
                    where: this.filter,
                    comparator: "start"
                })
            },
            render: function() {
                return this.renderWithTemplate(this), this.renderCollection(this.subcollection, WindowsItemView, this.queryByHook("windows-items")), this
            },
            addWindow: function() {
                var window, last = this.subcollection.at(this.subcollection.length - 1);
                window = last ? {
                    start: last.end,
                    end: (last.end + 120) % 1440,
                    headway: last.headway,
                    speed: last.speed,
                    type: this.filter.type
                } : {
                    start: 540,
                    end: 720,
                    headway: 15,
                    speed: 8,
                    type: this.filter.type
                }, this.collection.add(window)
            },
            removeWindow: function() {
                var last = this.subcollection.at(this.subcollection.length - 1);
                last && (this.collection.remove(last), last.stopListening())
            }
        })
    }, {
        "../views/windows-item": 56,
        "ampersand-subcollection": 152,
        "ampersand-view": 157,
        multiline: 182
    }],
    58: [function(require, module) {
        var View = require("ampersand-view"),
            WindowsSectionView = require("../views/windows-section"),
            multiline = require("multiline");
        module.exports = View.extend({
            template: multiline.stripIndent(function() {
                /*@preserve
                    <div class="windows">
                      <div data-hook="weekday"></div>
                      <div data-hook="saturday"></div>
                      <div data-hook="sunday"></div>
                    </div>
                  */
                console.log()
            }),
            render: function() {
                return this.renderWithTemplate(this), this.renderSubview(new WindowsSectionView({
                    collection: this.collection,
                    filter: {
                        type: "weekday"
                    },
                    sectionName: "Weekdays"
                }), this.queryByHook("weekday")), this.renderSubview(new WindowsSectionView({
                    collection: this.collection,
                    filter: {
                        type: "saturday"
                    },
                    sectionName: "Saturday"
                }), this.queryByHook("saturday")), this.renderSubview(new WindowsSectionView({
                    collection: this.collection,
                    filter: {
                        type: "sunday"
                    },
                    sectionName: "Sunday"
                }), this.queryByHook("sunday")), this
            }
        })
    }, {
        "../views/windows-section": 57,
        "ampersand-view": 157,
        multiline: 182
    }],
    59: [function(require, module, exports) {
        ! function(root, undefined) {
            function isString(obj) {
                return !!("" === obj || obj && obj.charCodeAt && obj.substr)
            }

            function isArray(obj) {
                return nativeIsArray ? nativeIsArray(obj) : "[object Array]" === toString.call(obj)
            }

            function isObject(obj) {
                return obj && "[object Object]" === toString.call(obj)
            }

            function defaults(object, defs) {
                var key;
                object = object || {}, defs = defs || {};
                for (key in defs) defs.hasOwnProperty(key) && null == object[key] && (object[key] = defs[key]);
                return object
            }

            function map(obj, iterator, context) {
                var i, j, results = [];
                if (!obj) return results;
                if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
                for (i = 0, j = obj.length; j > i; i++) results[i] = iterator.call(context, obj[i], i, obj);
                return results
            }

            function checkPrecision(val, base) {
                return val = Math.round(Math.abs(val)), isNaN(val) ? base : val
            }

            function checkCurrencyFormat(format) {
                var defaults = lib.settings.currency.format;
                return "function" == typeof format && (format = format()), isString(format) && format.match("%v") ? {
                    pos: format,
                    neg: format.replace("-", "").replace("%v", "-%v"),
                    zero: format
                } : format && format.pos && format.pos.match("%v") ? format : isString(defaults) ? lib.settings.currency.format = {
                    pos: defaults,
                    neg: defaults.replace("%v", "-%v"),
                    zero: defaults
                } : defaults
            }
            var lib = {};
            lib.version = "0.4.1", lib.settings = {
                currency: {
                    symbol: "$",
                    format: "%s%v",
                    decimal: ".",
                    thousand: ",",
                    precision: 2,
                    grouping: 3
                },
                number: {
                    precision: 0,
                    grouping: 3,
                    thousand: ",",
                    decimal: "."
                }
            };
            var nativeMap = Array.prototype.map,
                nativeIsArray = Array.isArray,
                toString = Object.prototype.toString,
                unformat = lib.unformat = lib.parse = function(value, decimal) {
                    if (isArray(value)) return map(value, function(val) {
                        return unformat(val, decimal)
                    });
                    if (value = value || 0, "number" == typeof value) return value;
                    decimal = decimal || lib.settings.number.decimal;
                    var regex = new RegExp("[^0-9-" + decimal + "]", ["g"]),
                        unformatted = parseFloat(("" + value).replace(/\((.*)\)/, "-$1").replace(regex, "").replace(decimal, "."));
                    return isNaN(unformatted) ? 0 : unformatted
                },
                toFixed = lib.toFixed = function(value, precision) {
                    precision = checkPrecision(precision, lib.settings.number.precision);
                    var power = Math.pow(10, precision);
                    return (Math.round(lib.unformat(value) * power) / power).toFixed(precision)
                },
                formatNumber = lib.formatNumber = lib.format = function(number, precision, thousand, decimal) {
                    if (isArray(number)) return map(number, function(val) {
                        return formatNumber(val, precision, thousand, decimal)
                    });
                    number = unformat(number);
                    var opts = defaults(isObject(precision) ? precision : {
                            precision: precision,
                            thousand: thousand,
                            decimal: decimal
                        }, lib.settings.number),
                        usePrecision = checkPrecision(opts.precision),
                        negative = 0 > number ? "-" : "",
                        base = parseInt(toFixed(Math.abs(number || 0), usePrecision), 10) + "",
                        mod = base.length > 3 ? base.length % 3 : 0;
                    return negative + (mod ? base.substr(0, mod) + opts.thousand : "") + base.substr(mod).replace(/(\d{3})(?=\d)/g, "$1" + opts.thousand) + (usePrecision ? opts.decimal + toFixed(Math.abs(number), usePrecision).split(".")[1] : "")
                },
                formatMoney = lib.formatMoney = function(number, symbol, precision, thousand, decimal, format) {
                    if (isArray(number)) return map(number, function(val) {
                        return formatMoney(val, symbol, precision, thousand, decimal, format)
                    });
                    number = unformat(number);
                    var opts = defaults(isObject(symbol) ? symbol : {
                            symbol: symbol,
                            precision: precision,
                            thousand: thousand,
                            decimal: decimal,
                            format: format
                        }, lib.settings.currency),
                        formats = checkCurrencyFormat(opts.format),
                        useFormat = number > 0 ? formats.pos : 0 > number ? formats.neg : formats.zero;
                    return useFormat.replace("%s", opts.symbol).replace("%v", formatNumber(Math.abs(number), checkPrecision(opts.precision), opts.thousand, opts.decimal))
                };
            lib.formatColumn = function(list, symbol, precision, thousand, decimal, format) {
                if (!list) return [];
                var opts = defaults(isObject(symbol) ? symbol : {
                        symbol: symbol,
                        precision: precision,
                        thousand: thousand,
                        decimal: decimal,
                        format: format
                    }, lib.settings.currency),
                    formats = checkCurrencyFormat(opts.format),
                    padAfterSymbol = formats.pos.indexOf("%s") < formats.pos.indexOf("%v") ? !0 : !1,
                    maxLength = 0,
                    formatted = map(list, function(val) {
                        if (isArray(val)) return lib.formatColumn(val, opts);
                        val = unformat(val);
                        var useFormat = val > 0 ? formats.pos : 0 > val ? formats.neg : formats.zero,
                            fVal = useFormat.replace("%s", opts.symbol).replace("%v", formatNumber(Math.abs(val), checkPrecision(opts.precision), opts.thousand, opts.decimal));
                        return fVal.length > maxLength && (maxLength = fVal.length), fVal
                    });
                return map(formatted, function(val) {
                    return isString(val) && val.length < maxLength ? padAfterSymbol ? val.replace(opts.symbol, opts.symbol + new Array(maxLength - val.length + 1).join(" ")) : new Array(maxLength - val.length + 1).join(" ") + val : val
                })
            }, "undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = lib), exports.accounting = lib) : "function" == typeof define && define.amd ? define([], function() {
                return lib
            }) : (lib.noConflict = function(oldAccounting) {
                return function() {
                    return root.accounting = oldAccounting, lib.noConflict = undefined, lib
                }
            }(root.accounting), root.accounting = lib)
        }(this)
    }, {}],
    60: [function(require, module) {
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-app"] = window.ampersand["ampersand-app"] || [], window.ampersand["ampersand-app"].push("1.0.3"));
        var Events = require("ampersand-events"),
            toArray = require("amp-to-array"),
            extend = require("amp-extend"),
            app = {
                extend: function() {
                    var args = toArray(arguments);
                    return args.unshift(this), extend.apply(null, args)
                },
                reset: function() {
                    this.off();
                    for (var item in this) "extend" !== item && "reset" !== item && delete this[item];
                    Events.createEmitter(this)
                }
            };
        Events.createEmitter(app), module.exports = app
    }, {
        "amp-extend": 61,
        "amp-to-array": 83,
        "ampersand-events": 84
    }],
    61: [function(require, module) {
        var isObject = require("amp-is-object");
        module.exports = function(obj) {
            if (!isObject(obj)) return obj;
            for (var source, prop, i = 1, length = arguments.length; length > i; i++) {
                source = arguments[i];
                for (prop in source) obj[prop] = source[prop]
            }
            return obj
        }
    }, {
        "amp-is-object": 62
    }],
    62: [function(require, module) {
        module.exports = function(obj) {
            var type = typeof obj;
            return !!obj && ("function" === type || "object" === type)
        }
    }, {}],
    63: [function(require, module) {
        var toString = Object.prototype.toString,
            nativeIsArray = Array.isArray;
        module.exports = nativeIsArray || function(obj) {
            return "[object Array]" === toString.call(obj)
        }
    }, {}],
    64: [function(require, module) {
        var createIteratee = require("amp-iteratee"),
            objKeys = require("amp-keys");
        module.exports = function(obj, iteratee, context) {
            if (null == obj) return [];
            iteratee = createIteratee(iteratee, context, 3);
            for (var currentKey, keys = obj.length !== +obj.length && objKeys(obj), length = (keys || obj).length, results = Array(length), index = 0; length > index; index++) currentKey = keys ? keys[index] : index, results[index] = iteratee(obj[currentKey], currentKey, obj);
            return results
        }
    }, {
        "amp-iteratee": 65,
        "amp-keys": 72
    }],
    65: [function(require, module) {
        var isFunction = require("amp-is-function"),
            isObject = require("amp-is-object"),
            createCallback = require("amp-create-callback"),
            matches = require("amp-matches"),
            property = require("amp-property"),
            identity = function(val) {
                return val
            };
        module.exports = function(value, context, argCount) {
            return null == value ? identity : isFunction(value) ? createCallback(value, context, argCount) : isObject(value) ? matches(value) : property(value)
        }
    }, {
        "amp-create-callback": 66,
        "amp-is-function": 67,
        "amp-is-object": 68,
        "amp-matches": 69,
        "amp-property": 71
    }],
    66: [function(require, module) {
        module.exports = function(func, context, argCount) {
            if (void 0 === context) return func;
            switch (argCount) {
                case 1:
                    return function(value) {
                        return func.call(context, value)
                    };
                case 2:
                    return function(value, other) {
                        return func.call(context, value, other)
                    };
                case 3:
                    return function(value, index, collection) {
                        return func.call(context, value, index, collection)
                    };
                case 4:
                    return function(accumulator, value, index, collection) {
                        return func.call(context, accumulator, value, index, collection)
                    }
            }
            return function() {
                return func.apply(context, arguments)
            }
        }
    }, {}],
    67: [function(require, module) {
        var toString = Object.prototype.toString,
            func = function(obj) {
                return "[object Function]" === toString.call(obj)
            };
        "function" != typeof /./ && (func = function(obj) {
            return "function" == typeof obj || !1
        }), module.exports = func
    }, {}],
    68: [function(require, module, exports) {
        arguments[4][62][0].apply(exports, arguments)
    }, {
        dup: 62
    }],
    69: [function(require, module) {
        var getPairs = require("amp-pairs");
        module.exports = function(attrs) {
            var pairs = getPairs(attrs),
                length = pairs.length;
            return function(obj) {
                if (null == obj) return !length;
                obj = new Object(obj);
                for (var i = 0; length > i; i++) {
                    var pair = pairs[i],
                        key = pair[0];
                    if (pair[1] !== obj[key] || !(key in obj)) return !1
                }
                return !0
            }
        }
    }, {
        "amp-pairs": 70
    }],
    70: [function(require, module) {
        var objKeys = require("amp-keys");
        module.exports = function(obj) {
            for (var keys = objKeys(obj), length = keys.length, result = Array(length), i = 0; length > i; i++) result[i] = [keys[i], obj[keys[i]]];
            return result
        }
    }, {
        "amp-keys": 72
    }],
    71: [function(require, module) {
        module.exports = function(key) {
            return function(obj) {
                return null == obj ? void 0 : obj[key]
            }
        }
    }, {}],
    72: [function(require, module) {
        var has = require("amp-has"),
            indexOf = require("amp-index-of"),
            isObject = require("amp-is-object"),
            nativeKeys = Object.keys,
            hasEnumBug = !{
                toString: null
            }.propertyIsEnumerable("toString"),
            nonEnumerableProps = ["constructor", "valueOf", "isPrototypeOf", "toString", "propertyIsEnumerable", "hasOwnProperty", "toLocaleString"];
        module.exports = function(obj) {
            if (!isObject(obj)) return [];
            if (nativeKeys) return nativeKeys(obj);
            var result = [];
            for (var key in obj) has(obj, key) && result.push(key);
            if (hasEnumBug)
                for (var nonEnumIdx = nonEnumerableProps.length; nonEnumIdx--;) {
                    var prop = nonEnumerableProps[nonEnumIdx];
                    has(obj, prop) && -1 === indexOf(result, prop) && result.push(prop)
                }
            return result
        }
    }, {
        "amp-has": 73,
        "amp-index-of": 74,
        "amp-is-object": 76
    }],
    73: [function(require, module) {
        var hasOwn = Object.prototype.hasOwnProperty;
        module.exports = function(obj, key) {
            return null != obj && hasOwn.call(obj, key)
        }
    }, {}],
    74: [function(require, module) {
        var isNumber = require("amp-is-number");
        module.exports = function(arr, item, from) {
            var i = 0,
                l = arr && arr.length;
            for (isNumber(from) && (i = 0 > from ? Math.max(0, l + from) : from); l > i; i++)
                if (arr[i] === item) return i;
            return -1
        }
    }, {
        "amp-is-number": 75
    }],
    75: [function(require, module) {
        var toString = Object.prototype.toString;
        module.exports = function(obj) {
            return "[object Number]" === toString.call(obj)
        }
    }, {}],
    76: [function(require, module, exports) {
        arguments[4][62][0].apply(exports, arguments)
    }, {
        dup: 62
    }],
    77: [function(require, module, exports) {
        arguments[4][72][0].apply(exports, arguments)
    }, {
        "amp-has": 78,
        "amp-index-of": 79,
        "amp-is-object": 81,
        dup: 72
    }],
    78: [function(require, module, exports) {
        arguments[4][73][0].apply(exports, arguments)
    }, {
        dup: 73
    }],
    79: [function(require, module, exports) {
        arguments[4][74][0].apply(exports, arguments)
    }, {
        "amp-is-number": 80,
        dup: 74
    }],
    80: [function(require, module, exports) {
        arguments[4][75][0].apply(exports, arguments)
    }, {
        dup: 75
    }],
    81: [function(require, module, exports) {
        arguments[4][62][0].apply(exports, arguments)
    }, {
        dup: 62
    }],
    82: [function(require, module) {
        var oKeys = require("amp-keys");
        module.exports = function(obj) {
            for (var keys = oKeys(obj), length = keys.length, vals = Array(length), i = 0; length > i; i++) vals[i] = obj[keys[i]];
            return vals
        }
    }, {
        "amp-keys": 77
    }],
    83: [function(require, module) {
        var values = require("amp-values"),
            map = require("amp-map"),
            isArray = require("amp-is-array"),
            slice = Array.prototype.slice,
            identity = function(val) {
                return val
            };
        module.exports = function(obj) {
            return obj ? isArray(obj) ? slice.call(obj) : obj.length === +obj.length ? map(obj, identity) : values(obj) : []
        }
    }, {
        "amp-is-array": 63,
        "amp-map": 64,
        "amp-values": 82
    }],
    84: [function(require, module) {
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-events"] = window.ampersand["ampersand-events"] || [], window.ampersand["ampersand-events"].push("1.0.1"));
        var runOnce = require("amp-once"),
            uniqueId = require("amp-unique-id"),
            keys = require("amp-keys"),
            isEmpty = require("amp-is-empty"),
            each = require("amp-each"),
            extend = (require("amp-bind"), require("amp-extend")),
            slice = Array.prototype.slice,
            eventSplitter = /\s+/,
            Events = {
                on: function(name, callback, context) {
                    if (!eventsApi(this, "on", name, [callback, context]) || !callback) return this;
                    this._events || (this._events = {});
                    var events = this._events[name] || (this._events[name] = []);
                    return events.push({
                        callback: callback,
                        context: context,
                        ctx: context || this
                    }), this
                },
                once: function(name, callback, context) {
                    if (!eventsApi(this, "once", name, [callback, context]) || !callback) return this;
                    var self = this,
                        once = runOnce(function() {
                            self.off(name, once), callback.apply(this, arguments)
                        });
                    return once._callback = callback, this.on(name, once, context)
                },
                off: function(name, callback, context) {
                    var retain, ev, events, names, i, l, j, k;
                    if (!this._events || !eventsApi(this, "off", name, [callback, context])) return this;
                    if (!name && !callback && !context) return this._events = void 0, this;
                    for (names = name ? [name] : keys(this._events), i = 0, l = names.length; l > i; i++)
                        if (name = names[i], events = this._events[name]) {
                            if (this._events[name] = retain = [], callback || context)
                                for (j = 0, k = events.length; k > j; j++) ev = events[j], (callback && callback !== ev.callback && callback !== ev.callback._callback || context && context !== ev.context) && retain.push(ev);
                            retain.length || delete this._events[name]
                        }
                    return this
                },
                trigger: function(name) {
                    if (!this._events) return this;
                    var args = slice.call(arguments, 1);
                    if (!eventsApi(this, "trigger", name, args)) return this;
                    var events = this._events[name],
                        allEvents = this._events.all;
                    return events && triggerEvents(events, args), allEvents && triggerEvents(allEvents, arguments), this
                },
                stopListening: function(obj, name, callback) {
                    var listeningTo = this._listeningTo;
                    if (!listeningTo) return this;
                    var remove = !name && !callback;
                    callback || "object" != typeof name || (callback = this), obj && ((listeningTo = {})[obj._listenId] = obj);
                    for (var id in listeningTo) obj = listeningTo[id], obj.off(name, callback, this), (remove || isEmpty(obj._events)) && delete this._listeningTo[id];
                    return this
                },
                createEmitter: function(obj) {
                    return extend(obj || {}, Events)
                }
            },
            eventsApi = function(obj, action, name, rest) {
                if (!name) return !0;
                if ("object" == typeof name) {
                    for (var key in name) obj[action].apply(obj, [key, name[key]].concat(rest));
                    return !1
                }
                if (eventSplitter.test(name)) {
                    for (var names = name.split(eventSplitter), i = 0, l = names.length; l > i; i++) obj[action].apply(obj, [names[i]].concat(rest));
                    return !1
                }
                return !0
            },
            triggerEvents = function(events, args) {
                var ev, i = -1,
                    l = events.length,
                    a1 = args[0],
                    a2 = args[1],
                    a3 = args[2];
                switch (args.length) {
                    case 0:
                        for (; ++i < l;)(ev = events[i]).callback.call(ev.ctx);
                        return;
                    case 1:
                        for (; ++i < l;)(ev = events[i]).callback.call(ev.ctx, a1);
                        return;
                    case 2:
                        for (; ++i < l;)(ev = events[i]).callback.call(ev.ctx, a1, a2);
                        return;
                    case 3:
                        for (; ++i < l;)(ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
                        return;
                    default:
                        for (; ++i < l;)(ev = events[i]).callback.apply(ev.ctx, args);
                        return
                }
            },
            listenMethods = {
                listenTo: "on",
                listenToOnce: "once"
            };
        each(listenMethods, function(implementation, method) {
            Events[method] = function(obj, name, callback) {
                var listeningTo = this._listeningTo || (this._listeningTo = {}),
                    id = obj._listenId || (obj._listenId = uniqueId("l"));
                return listeningTo[id] = obj, callback || "object" != typeof name || (callback = this), obj[implementation](name, callback, this), this
            }
        }), Events.listenToAndRun = function(obj, name, callback) {
            return Events.listenTo.apply(this, arguments), callback || "object" != typeof name || (callback = this), callback.apply(this), this
        }, module.exports = Events
    }, {
        "amp-bind": 85,
        "amp-each": 88,
        "amp-extend": 61,
        "amp-is-empty": 90,
        "amp-keys": 96,
        "amp-once": 102,
        "amp-unique-id": 103
    }],
    85: [function(require, module) {
        var isFunction = require("amp-is-function"),
            isObject = require("amp-is-object"),
            nativeBind = Function.prototype.bind,
            slice = Array.prototype.slice,
            Ctor = function() {};
        module.exports = function(func, context) {
            var args, bound;
            if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
            if (!isFunction(func)) throw new TypeError("Bind must be called on a function");
            return args = slice.call(arguments, 2), bound = function() {
                if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
                Ctor.prototype = func.prototype;
                var self = new Ctor;
                Ctor.prototype = null;
                var result = func.apply(self, args.concat(slice.call(arguments)));
                return isObject(result) ? result : self
            }
        }
    }, {
        "amp-is-function": 86,
        "amp-is-object": 87
    }],
    86: [function(require, module, exports) {
        arguments[4][67][0].apply(exports, arguments)
    }, {
        dup: 67
    }],
    87: [function(require, module, exports) {
        arguments[4][62][0].apply(exports, arguments)
    }, {
        dup: 62
    }],
    88: [function(require, module) {
        var objKeys = require("amp-keys"),
            createCallback = require("amp-create-callback");
        module.exports = function(obj, iteratee, context) {
            if (null == obj) return obj;
            iteratee = createCallback(iteratee, context);
            var i, length = obj.length;
            if (length === +length)
                for (i = 0; length > i; i++) iteratee(obj[i], i, obj);
            else {
                var keys = objKeys(obj);
                for (i = 0, length = keys.length; length > i; i++) iteratee(obj[keys[i]], keys[i], obj)
            }
            return obj
        }
    }, {
        "amp-create-callback": 89,
        "amp-keys": 96
    }],
    89: [function(require, module, exports) {
        arguments[4][66][0].apply(exports, arguments)
    }, {
        dup: 66
    }],
    90: [function(require, module) {
        var isArray = require("amp-is-array"),
            isString = require("amp-is-string"),
            isArguments = require("amp-is-arguments"),
            isNumber = require("amp-is-number"),
            isNan = require("amp-is-nan"),
            keys = require("amp-keys");
        module.exports = function(obj) {
            return null == obj ? !0 : isArray(obj) || isString(obj) || isArguments(obj) ? 0 === obj.length : isNumber(obj) ? 0 === obj || isNan(obj) : 0 !== keys(obj).length ? !1 : !0
        }
    }, {
        "amp-is-arguments": 91,
        "amp-is-array": 92,
        "amp-is-nan": 93,
        "amp-is-number": 94,
        "amp-is-string": 95,
        "amp-keys": 96
    }],
    91: [function(require, module) {
        var toString = Object.prototype.toString,
            hasOwn = Object.prototype.hasOwnProperty,
            isArgs = function(obj) {
                return "[object Arguments]" === toString.call(obj)
            };
        isArgs(arguments) || (isArgs = function(obj) {
            return obj && hasOwn.call(obj, "callee")
        }), module.exports = isArgs
    }, {}],
    92: [function(require, module, exports) {
        arguments[4][63][0].apply(exports, arguments)
    }, {
        dup: 63
    }],
    93: [function(require, module) {
        var isNumber = require("amp-is-number");
        module.exports = function(obj) {
            return isNumber(obj) && obj !== +obj
        }
    }, {
        "amp-is-number": 94
    }],
    94: [function(require, module, exports) {
        arguments[4][75][0].apply(exports, arguments)
    }, {
        dup: 75
    }],
    95: [function(require, module) {
        var toString = Object.prototype.toString;
        module.exports = function(obj) {
            return "[object String]" === toString.call(obj)
        }
    }, {}],
    96: [function(require, module, exports) {
        arguments[4][72][0].apply(exports, arguments)
    }, {
        "amp-has": 97,
        "amp-index-of": 98,
        "amp-is-object": 100,
        dup: 72
    }],
    97: [function(require, module, exports) {
        arguments[4][73][0].apply(exports, arguments)
    }, {
        dup: 73
    }],
    98: [function(require, module, exports) {
        arguments[4][74][0].apply(exports, arguments)
    }, {
        "amp-is-number": 99,
        dup: 74
    }],
    99: [function(require, module, exports) {
        arguments[4][75][0].apply(exports, arguments)
    }, {
        dup: 75
    }],
    100: [function(require, module, exports) {
        arguments[4][62][0].apply(exports, arguments)
    }, {
        dup: 62
    }],
    101: [function(require, module) {
        module.exports = function(fn, times) {
            var memo;
            return function() {
                return times-- > 0 ? memo = fn.apply(this, arguments) : fn = null, memo
            }
        }
    }, {}],
    102: [function(require, module) {
        var limitCalls = require("amp-limit-calls");
        module.exports = function(fn) {
            return limitCalls(fn, 1)
        }
    }, {
        "amp-limit-calls": 101
    }],
    103: [function(require, module) {
        (function(global) {
            var theGlobal = "undefined" != typeof window ? window : global;
            theGlobal.__ampIdCounter || (theGlobal.__ampIdCounter = 0), module.exports = function(prefix) {
                var id = ++theGlobal.__ampIdCounter + "";
                return prefix ? prefix + id : id
            }
        }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
    }, {}],
    104: [function(require, module) {
        var objectExtend = require("extend-object"),
            extend = function(protoProps) {
                var child, parent = this,
                    args = [].slice.call(arguments);
                child = protoProps && protoProps.hasOwnProperty("constructor") ? protoProps.constructor : function() {
                    return parent.apply(this, arguments)
                }, objectExtend(child, parent);
                var Surrogate = function() {
                    this.constructor = child
                };
                return Surrogate.prototype = parent.prototype, child.prototype = new Surrogate, protoProps && (args.unshift(child.prototype), objectExtend.apply(null, args)), child.__super__ = parent.prototype, child
            };
        module.exports = extend
    }, {
        "extend-object": 105
    }],
    105: [function(require, module) {
        var arr = [],
            each = arr.forEach,
            slice = arr.slice;
        module.exports = function(obj) {
            return each.call(slice.call(arguments, 1), function(source) {
                if (source)
                    for (var prop in source) obj[prop] = source[prop]
            }), obj
        }
    }, {}],
    106: [function(require, module) {
        function CollectionView(spec) {
            if (!spec) throw new ReferenceError("Collection view missing required parameters: collection, el");
            if (!spec.collection) throw new ReferenceError("Collection view requires a collection");
            if (!spec.el && !this.insertSelf) throw new ReferenceError("Collection view requires an el");
            _.extend(this, _.pick(spec, options)), this.views = [], this.listenTo(this.collection, "add", this._addViewForModel), this.listenTo(this.collection, "remove", this._removeViewForModel), this.listenTo(this.collection, "sort", this._rerenderAll), this.listenTo(this.collection, "refresh reset", this._reset)
        }
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-collection-view"] = window.ampersand["ampersand-collection-view"] || [], window.ampersand["ampersand-collection-view"].push("1.2.1"));
        var _ = require("underscore"),
            BBEvents = require("backbone-events-standalone"),
            ampExtend = require("ampersand-class-extend"),
            options = ["collection", "el", "viewOptions", "view", "emptyView", "filter", "reverse", "parent"];
        _.extend(CollectionView.prototype, BBEvents, {
            render: function() {
                return this._renderAll(), this
            },
            remove: function() {
                _.invoke(this.views, "remove"), this.stopListening()
            },
            _getViewByModel: function(model) {
                return _.find(this.views, function(view) {
                    return model === view.model
                })
            },
            _createViewForModel: function(model, renderOpts) {
                var view = new this.view(_({
                    model: model,
                    collection: this.collection
                }).extend(this.viewOptions));
                return this.views.push(view), view.parent = this, view.renderedByParentView = !0, view.render(renderOpts), view
            },
            _getOrCreateByModel: function(model, renderOpts) {
                return this._getViewByModel(model) || this._createViewForModel(model, renderOpts)
            },
            _addViewForModel: function(model, collection, options) {
                var matches = this.filter ? this.filter(model) : !0;
                if (matches) {
                    this.renderedEmptyView && (this.renderedEmptyView.remove(), delete this.renderedEmptyView);
                    var view = this._getOrCreateByModel(model, {
                        containerEl: this.el
                    });
                    options && options.rerender ? this._insertView(view) : this._insertViewAtIndex(view)
                }
            },
            _insertViewAtIndex: function(view) {
                if (!view.insertSelf) {
                    var modelToInsertBefore, viewToInsertBefore, pos = this.collection.indexOf(view.model);
                    modelToInsertBefore = this.collection.at(this.reverse ? pos - 1 : pos + 1), viewToInsertBefore = this._getViewByModel(modelToInsertBefore), viewToInsertBefore ? this.el.insertBefore(view.el, viewToInsertBefore && viewToInsertBefore.el) : this.el.appendChild(view.el)
                }
            },
            _insertView: function(view) {
                view.insertSelf || (this.reverse && this.el.firstChild ? this.el.insertBefore(view.el, this.el.firstChild) : this.el.appendChild(view.el))
            },
            _removeViewForModel: function(model) {
                var view = this._getViewByModel(model);
                if (view) {
                    var index = this.views.indexOf(view); - 1 !== index && (view = this.views.splice(index, 1)[0], this._removeView(view), 0 === this.views.length && this._renderEmptyView())
                }
            },
            _removeView: function(view) {
                view.animateRemove ? view.animateRemove() : view.remove()
            },
            _renderAll: function() {
                this.collection.each(this._addViewForModel, this), 0 === this.views.length && this._renderEmptyView()
            },
            _rerenderAll: function(collection, options) {
                options = options || {}, this.collection.each(function(model) {
                    this._addViewForModel(model, this, _.extend(options, {
                        rerender: !0
                    }))
                }, this)
            },
            _renderEmptyView: function() {
                if (this.emptyView && !this.renderedEmptyView) {
                    var view = this.renderedEmptyView = new this.emptyView;
                    this.el.appendChild(view.render().el)
                }
            },
            _reset: function() {
                var newViews = this.collection.map(this._getOrCreateByModel, this),
                    toRemove = _.difference(this.views, newViews);
                toRemove.forEach(this._removeView, this), this.views = newViews, this._rerenderAll(), 0 === this.views.length && this._renderEmptyView()
            }
        }), CollectionView.extend = ampExtend, module.exports = CollectionView
    }, {
        "ampersand-class-extend": 104,
        "backbone-events-standalone": 169,
        underscore: 107
    }],
    107: [function(require, module, exports) {
        (function() {
            var root = this,
                previousUnderscore = root._,
                breaker = {},
                ArrayProto = Array.prototype,
                ObjProto = Object.prototype,
                FuncProto = Function.prototype,
                push = ArrayProto.push,
                slice = ArrayProto.slice,
                concat = ArrayProto.concat,
                toString = ObjProto.toString,
                hasOwnProperty = ObjProto.hasOwnProperty,
                nativeForEach = ArrayProto.forEach,
                nativeMap = ArrayProto.map,
                nativeReduce = ArrayProto.reduce,
                nativeReduceRight = ArrayProto.reduceRight,
                nativeFilter = ArrayProto.filter,
                nativeEvery = ArrayProto.every,
                nativeSome = ArrayProto.some,
                nativeIndexOf = ArrayProto.indexOf,
                nativeLastIndexOf = ArrayProto.lastIndexOf,
                nativeIsArray = Array.isArray,
                nativeKeys = Object.keys,
                nativeBind = FuncProto.bind,
                _ = function(obj) {
                    return obj instanceof _ ? obj : this instanceof _ ? void(this._wrapped = obj) : new _(obj)
                };
            "undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = _), exports._ = _) : root._ = _, _.VERSION = "1.6.0";
            var each = _.each = _.forEach = function(obj, iterator, context) {
                if (null == obj) return obj;
                if (nativeForEach && obj.forEach === nativeForEach) obj.forEach(iterator, context);
                else if (obj.length === +obj.length) {
                    for (var i = 0, length = obj.length; length > i; i++)
                        if (iterator.call(context, obj[i], i, obj) === breaker) return
                } else
                    for (var keys = _.keys(obj), i = 0, length = keys.length; length > i; i++)
                        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return; return obj
            };
            _.map = _.collect = function(obj, iterator, context) {
                var results = [];
                return null == obj ? results : nativeMap && obj.map === nativeMap ? obj.map(iterator, context) : (each(obj, function(value, index, list) {
                    results.push(iterator.call(context, value, index, list))
                }), results)
            };
            var reduceError = "Reduce of empty array with no initial value";
            _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
                var initial = arguments.length > 2;
                if (null == obj && (obj = []), nativeReduce && obj.reduce === nativeReduce) return context && (iterator = _.bind(iterator, context)), initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
                if (each(obj, function(value, index, list) {
                        initial ? memo = iterator.call(context, memo, value, index, list) : (memo = value, initial = !0)
                    }), !initial) throw new TypeError(reduceError);
                return memo
            }, _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
                var initial = arguments.length > 2;
                if (null == obj && (obj = []), nativeReduceRight && obj.reduceRight === nativeReduceRight) return context && (iterator = _.bind(iterator, context)), initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
                var length = obj.length;
                if (length !== +length) {
                    var keys = _.keys(obj);
                    length = keys.length
                }
                if (each(obj, function(value, index, list) {
                        index = keys ? keys[--length] : --length, initial ? memo = iterator.call(context, memo, obj[index], index, list) : (memo = obj[index], initial = !0)
                    }), !initial) throw new TypeError(reduceError);
                return memo
            }, _.find = _.detect = function(obj, predicate, context) {
                var result;
                return any(obj, function(value, index, list) {
                    return predicate.call(context, value, index, list) ? (result = value, !0) : void 0
                }), result
            }, _.filter = _.select = function(obj, predicate, context) {
                var results = [];
                return null == obj ? results : nativeFilter && obj.filter === nativeFilter ? obj.filter(predicate, context) : (each(obj, function(value, index, list) {
                    predicate.call(context, value, index, list) && results.push(value)
                }), results)
            }, _.reject = function(obj, predicate, context) {
                return _.filter(obj, function(value, index, list) {
                    return !predicate.call(context, value, index, list)
                }, context)
            }, _.every = _.all = function(obj, predicate, context) {
                predicate || (predicate = _.identity);
                var result = !0;
                return null == obj ? result : nativeEvery && obj.every === nativeEvery ? obj.every(predicate, context) : (each(obj, function(value, index, list) {
                    return (result = result && predicate.call(context, value, index, list)) ? void 0 : breaker
                }), !!result)
            };
            var any = _.some = _.any = function(obj, predicate, context) {
                predicate || (predicate = _.identity);
                var result = !1;
                return null == obj ? result : nativeSome && obj.some === nativeSome ? obj.some(predicate, context) : (each(obj, function(value, index, list) {
                    return result || (result = predicate.call(context, value, index, list)) ? breaker : void 0
                }), !!result)
            };
            _.contains = _.include = function(obj, target) {
                return null == obj ? !1 : nativeIndexOf && obj.indexOf === nativeIndexOf ? -1 != obj.indexOf(target) : any(obj, function(value) {
                    return value === target
                })
            }, _.invoke = function(obj, method) {
                var args = slice.call(arguments, 2),
                    isFunc = _.isFunction(method);
                return _.map(obj, function(value) {
                    return (isFunc ? method : value[method]).apply(value, args)
                })
            }, _.pluck = function(obj, key) {
                return _.map(obj, _.property(key))
            }, _.where = function(obj, attrs) {
                return _.filter(obj, _.matches(attrs))
            }, _.findWhere = function(obj, attrs) {
                return _.find(obj, _.matches(attrs))
            }, _.max = function(obj, iterator, context) {
                if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) return Math.max.apply(Math, obj);
                var result = -(1 / 0),
                    lastComputed = -(1 / 0);
                return each(obj, function(value, index, list) {
                    var computed = iterator ? iterator.call(context, value, index, list) : value;
                    computed > lastComputed && (result = value, lastComputed = computed)
                }), result
            }, _.min = function(obj, iterator, context) {
                if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) return Math.min.apply(Math, obj);
                var result = 1 / 0,
                    lastComputed = 1 / 0;
                return each(obj, function(value, index, list) {
                    var computed = iterator ? iterator.call(context, value, index, list) : value;
                    lastComputed > computed && (result = value, lastComputed = computed)
                }), result
            }, _.shuffle = function(obj) {
                var rand, index = 0,
                    shuffled = [];
                return each(obj, function(value) {
                    rand = _.random(index++), shuffled[index - 1] = shuffled[rand], shuffled[rand] = value
                }), shuffled
            }, _.sample = function(obj, n, guard) {
                return null == n || guard ? (obj.length !== +obj.length && (obj = _.values(obj)), obj[_.random(obj.length - 1)]) : _.shuffle(obj).slice(0, Math.max(0, n))
            };
            var lookupIterator = function(value) {
                return null == value ? _.identity : _.isFunction(value) ? value : _.property(value)
            };
            _.sortBy = function(obj, iterator, context) {
                return iterator = lookupIterator(iterator), _.pluck(_.map(obj, function(value, index, list) {
                    return {
                        value: value,
                        index: index,
                        criteria: iterator.call(context, value, index, list)
                    }
                }).sort(function(left, right) {
                    var a = left.criteria,
                        b = right.criteria;
                    if (a !== b) {
                        if (a > b || void 0 === a) return 1;
                        if (b > a || void 0 === b) return -1
                    }
                    return left.index - right.index
                }), "value")
            };
            var group = function(behavior) {
                return function(obj, iterator, context) {
                    var result = {};
                    return iterator = lookupIterator(iterator), each(obj, function(value, index) {
                        var key = iterator.call(context, value, index, obj);
                        behavior(result, key, value)
                    }), result
                }
            };
            _.groupBy = group(function(result, key, value) {
                _.has(result, key) ? result[key].push(value) : result[key] = [value]
            }), _.indexBy = group(function(result, key, value) {
                result[key] = value
            }), _.countBy = group(function(result, key) {
                _.has(result, key) ? result[key]++ : result[key] = 1
            }), _.sortedIndex = function(array, obj, iterator, context) {
                iterator = lookupIterator(iterator);
                for (var value = iterator.call(context, obj), low = 0, high = array.length; high > low;) {
                    var mid = low + high >>> 1;
                    iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid
                }
                return low
            }, _.toArray = function(obj) {
                return obj ? _.isArray(obj) ? slice.call(obj) : obj.length === +obj.length ? _.map(obj, _.identity) : _.values(obj) : []
            }, _.size = function(obj) {
                return null == obj ? 0 : obj.length === +obj.length ? obj.length : _.keys(obj).length
            }, _.first = _.head = _.take = function(array, n, guard) {
                return null == array ? void 0 : null == n || guard ? array[0] : 0 > n ? [] : slice.call(array, 0, n)
            }, _.initial = function(array, n, guard) {
                return slice.call(array, 0, array.length - (null == n || guard ? 1 : n))
            }, _.last = function(array, n, guard) {
                return null == array ? void 0 : null == n || guard ? array[array.length - 1] : slice.call(array, Math.max(array.length - n, 0))
            }, _.rest = _.tail = _.drop = function(array, n, guard) {
                return slice.call(array, null == n || guard ? 1 : n)
            }, _.compact = function(array) {
                return _.filter(array, _.identity)
            };
            var flatten = function(input, shallow, output) {
                return shallow && _.every(input, _.isArray) ? concat.apply(output, input) : (each(input, function(value) {
                    _.isArray(value) || _.isArguments(value) ? shallow ? push.apply(output, value) : flatten(value, shallow, output) : output.push(value)
                }), output)
            };
            _.flatten = function(array, shallow) {
                return flatten(array, shallow, [])
            }, _.without = function(array) {
                return _.difference(array, slice.call(arguments, 1))
            }, _.partition = function(array, predicate) {
                var pass = [],
                    fail = [];
                return each(array, function(elem) {
                    (predicate(elem) ? pass : fail).push(elem)
                }), [pass, fail]
            }, _.uniq = _.unique = function(array, isSorted, iterator, context) {
                _.isFunction(isSorted) && (context = iterator, iterator = isSorted, isSorted = !1);
                var initial = iterator ? _.map(array, iterator, context) : array,
                    results = [],
                    seen = [];
                return each(initial, function(value, index) {
                    (isSorted ? index && seen[seen.length - 1] === value : _.contains(seen, value)) || (seen.push(value), results.push(array[index]))
                }), results
            }, _.union = function() {
                return _.uniq(_.flatten(arguments, !0))
            }, _.intersection = function(array) {
                var rest = slice.call(arguments, 1);
                return _.filter(_.uniq(array), function(item) {
                    return _.every(rest, function(other) {
                        return _.contains(other, item)
                    })
                })
            }, _.difference = function(array) {
                var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
                return _.filter(array, function(value) {
                    return !_.contains(rest, value)
                })
            }, _.zip = function() {
                for (var length = _.max(_.pluck(arguments, "length").concat(0)), results = new Array(length), i = 0; length > i; i++) results[i] = _.pluck(arguments, "" + i);
                return results
            }, _.object = function(list, values) {
                if (null == list) return {};
                for (var result = {}, i = 0, length = list.length; length > i; i++) values ? result[list[i]] = values[i] : result[list[i][0]] = list[i][1];
                return result
            }, _.indexOf = function(array, item, isSorted) {
                if (null == array) return -1;
                var i = 0,
                    length = array.length;
                if (isSorted) {
                    if ("number" != typeof isSorted) return i = _.sortedIndex(array, item), array[i] === item ? i : -1;
                    i = 0 > isSorted ? Math.max(0, length + isSorted) : isSorted
                }
                if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
                for (; length > i; i++)
                    if (array[i] === item) return i;
                return -1
            }, _.lastIndexOf = function(array, item, from) {
                if (null == array) return -1;
                var hasIndex = null != from;
                if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
                for (var i = hasIndex ? from : array.length; i--;)
                    if (array[i] === item) return i;
                return -1
            }, _.range = function(start, stop, step) {
                arguments.length <= 1 && (stop = start || 0, start = 0), step = arguments[2] || 1;
                for (var length = Math.max(Math.ceil((stop - start) / step), 0), idx = 0, range = new Array(length); length > idx;) range[idx++] = start, start += step;
                return range
            };
            var ctor = function() {};
            _.bind = function(func, context) {
                var args, bound;
                if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
                if (!_.isFunction(func)) throw new TypeError;
                return args = slice.call(arguments, 2), bound = function() {
                    if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
                    ctor.prototype = func.prototype;
                    var self = new ctor;
                    ctor.prototype = null;
                    var result = func.apply(self, args.concat(slice.call(arguments)));
                    return Object(result) === result ? result : self
                }
            }, _.partial = function(func) {
                var boundArgs = slice.call(arguments, 1);
                return function() {
                    for (var position = 0, args = boundArgs.slice(), i = 0, length = args.length; length > i; i++) args[i] === _ && (args[i] = arguments[position++]);
                    for (; position < arguments.length;) args.push(arguments[position++]);
                    return func.apply(this, args)
                }
            }, _.bindAll = function(obj) {
                var funcs = slice.call(arguments, 1);
                if (0 === funcs.length) throw new Error("bindAll must be passed function names");
                return each(funcs, function(f) {
                    obj[f] = _.bind(obj[f], obj)
                }), obj
            }, _.memoize = function(func, hasher) {
                var memo = {};
                return hasher || (hasher = _.identity),
                    function() {
                        var key = hasher.apply(this, arguments);
                        return _.has(memo, key) ? memo[key] : memo[key] = func.apply(this, arguments)
                    }
            }, _.delay = function(func, wait) {
                var args = slice.call(arguments, 2);
                return setTimeout(function() {
                    return func.apply(null, args)
                }, wait)
            }, _.defer = function(func) {
                return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)))
            }, _.throttle = function(func, wait, options) {
                var context, args, result, timeout = null,
                    previous = 0;
                options || (options = {});
                var later = function() {
                    previous = options.leading === !1 ? 0 : _.now(), timeout = null, result = func.apply(context, args), context = args = null
                };
                return function() {
                    var now = _.now();
                    previous || options.leading !== !1 || (previous = now);
                    var remaining = wait - (now - previous);
                    return context = this, args = arguments, 0 >= remaining ? (clearTimeout(timeout), timeout = null, previous = now, result = func.apply(context, args), context = args = null) : timeout || options.trailing === !1 || (timeout = setTimeout(later, remaining)), result
                }
            }, _.debounce = function(func, wait, immediate) {
                var timeout, args, context, timestamp, result, later = function() {
                    var last = _.now() - timestamp;
                    wait > last ? timeout = setTimeout(later, wait - last) : (timeout = null, immediate || (result = func.apply(context, args), context = args = null))
                };
                return function() {
                    context = this, args = arguments, timestamp = _.now();
                    var callNow = immediate && !timeout;
                    return timeout || (timeout = setTimeout(later, wait)), callNow && (result = func.apply(context, args), context = args = null), result
                }
            }, _.once = function(func) {
                var memo, ran = !1;
                return function() {
                    return ran ? memo : (ran = !0, memo = func.apply(this, arguments), func = null, memo)
                }
            }, _.wrap = function(func, wrapper) {
                return _.partial(wrapper, func)
            }, _.compose = function() {
                var funcs = arguments;
                return function() {
                    for (var args = arguments, i = funcs.length - 1; i >= 0; i--) args = [funcs[i].apply(this, args)];
                    return args[0]
                }
            }, _.after = function(times, func) {
                return function() {
                    return --times < 1 ? func.apply(this, arguments) : void 0
                }
            }, _.keys = function(obj) {
                if (!_.isObject(obj)) return [];
                if (nativeKeys) return nativeKeys(obj);
                var keys = [];
                for (var key in obj) _.has(obj, key) && keys.push(key);
                return keys
            }, _.values = function(obj) {
                for (var keys = _.keys(obj), length = keys.length, values = new Array(length), i = 0; length > i; i++) values[i] = obj[keys[i]];
                return values
            }, _.pairs = function(obj) {
                for (var keys = _.keys(obj), length = keys.length, pairs = new Array(length), i = 0; length > i; i++) pairs[i] = [keys[i], obj[keys[i]]];
                return pairs
            }, _.invert = function(obj) {
                for (var result = {}, keys = _.keys(obj), i = 0, length = keys.length; length > i; i++) result[obj[keys[i]]] = keys[i];
                return result
            }, _.functions = _.methods = function(obj) {
                var names = [];
                for (var key in obj) _.isFunction(obj[key]) && names.push(key);
                return names.sort()
            }, _.extend = function(obj) {
                return each(slice.call(arguments, 1), function(source) {
                    if (source)
                        for (var prop in source) obj[prop] = source[prop]
                }), obj
            }, _.pick = function(obj) {
                var copy = {},
                    keys = concat.apply(ArrayProto, slice.call(arguments, 1));
                return each(keys, function(key) {
                    key in obj && (copy[key] = obj[key])
                }), copy
            }, _.omit = function(obj) {
                var copy = {},
                    keys = concat.apply(ArrayProto, slice.call(arguments, 1));
                for (var key in obj) _.contains(keys, key) || (copy[key] = obj[key]);
                return copy
            }, _.defaults = function(obj) {
                return each(slice.call(arguments, 1), function(source) {
                    if (source)
                        for (var prop in source) void 0 === obj[prop] && (obj[prop] = source[prop])
                }), obj
            }, _.clone = function(obj) {
                return _.isObject(obj) ? _.isArray(obj) ? obj.slice() : _.extend({}, obj) : obj
            }, _.tap = function(obj, interceptor) {
                return interceptor(obj), obj
            };
            var eq = function(a, b, aStack, bStack) {
                if (a === b) return 0 !== a || 1 / a == 1 / b;
                if (null == a || null == b) return a === b;
                a instanceof _ && (a = a._wrapped), b instanceof _ && (b = b._wrapped);
                var className = toString.call(a);
                if (className != toString.call(b)) return !1;
                switch (className) {
                    case "[object String]":
                        return a == String(b);
                    case "[object Number]":
                        return a != +a ? b != +b : 0 == a ? 1 / a == 1 / b : a == +b;
                    case "[object Date]":
                    case "[object Boolean]":
                        return +a == +b;
                    case "[object RegExp]":
                        return a.source == b.source && a.global == b.global && a.multiline == b.multiline && a.ignoreCase == b.ignoreCase
                }
                if ("object" != typeof a || "object" != typeof b) return !1;
                for (var length = aStack.length; length--;)
                    if (aStack[length] == a) return bStack[length] == b;
                var aCtor = a.constructor,
                    bCtor = b.constructor;
                if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor) && "constructor" in a && "constructor" in b) return !1;
                aStack.push(a), bStack.push(b);
                var size = 0,
                    result = !0;
                if ("[object Array]" == className) {
                    if (size = a.length, result = size == b.length)
                        for (; size-- && (result = eq(a[size], b[size], aStack, bStack)););
                } else {
                    for (var key in a)
                        if (_.has(a, key) && (size++, !(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack)))) break;
                    if (result) {
                        for (key in b)
                            if (_.has(b, key) && !size--) break;
                        result = !size
                    }
                }
                return aStack.pop(), bStack.pop(), result
            };
            _.isEqual = function(a, b) {
                return eq(a, b, [], [])
            }, _.isEmpty = function(obj) {
                if (null == obj) return !0;
                if (_.isArray(obj) || _.isString(obj)) return 0 === obj.length;
                for (var key in obj)
                    if (_.has(obj, key)) return !1;
                return !0
            }, _.isElement = function(obj) {
                return !(!obj || 1 !== obj.nodeType)
            }, _.isArray = nativeIsArray || function(obj) {
                return "[object Array]" == toString.call(obj)
            }, _.isObject = function(obj) {
                return obj === Object(obj)
            }, each(["Arguments", "Function", "String", "Number", "Date", "RegExp"], function(name) {
                _["is" + name] = function(obj) {
                    return toString.call(obj) == "[object " + name + "]"
                }
            }), _.isArguments(arguments) || (_.isArguments = function(obj) {
                return !(!obj || !_.has(obj, "callee"))
            }), "function" != typeof /./ && (_.isFunction = function(obj) {
                return "function" == typeof obj
            }), _.isFinite = function(obj) {
                return isFinite(obj) && !isNaN(parseFloat(obj))
            }, _.isNaN = function(obj) {
                return _.isNumber(obj) && obj != +obj
            }, _.isBoolean = function(obj) {
                return obj === !0 || obj === !1 || "[object Boolean]" == toString.call(obj)
            }, _.isNull = function(obj) {
                return null === obj
            }, _.isUndefined = function(obj) {
                return void 0 === obj
            }, _.has = function(obj, key) {
                return hasOwnProperty.call(obj, key)
            }, _.noConflict = function() {
                return root._ = previousUnderscore, this
            }, _.identity = function(value) {
                return value
            }, _.constant = function(value) {
                return function() {
                    return value
                }
            }, _.property = function(key) {
                return function(obj) {
                    return obj[key]
                }
            }, _.matches = function(attrs) {
                return function(obj) {
                    if (obj === attrs) return !0;
                    for (var key in attrs)
                        if (attrs[key] !== obj[key]) return !1;
                    return !0
                }
            }, _.times = function(n, iterator, context) {
                for (var accum = Array(Math.max(0, n)), i = 0; n > i; i++) accum[i] = iterator.call(context, i);
                return accum
            }, _.random = function(min, max) {
                return null == max && (max = min, min = 0), min + Math.floor(Math.random() * (max - min + 1))
            }, _.now = Date.now || function() {
                return (new Date).getTime()
            };
            var entityMap = {
                escape: {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#x27;"
                }
            };
            entityMap.unescape = _.invert(entityMap.escape);
            var entityRegexes = {
                escape: new RegExp("[" + _.keys(entityMap.escape).join("") + "]", "g"),
                unescape: new RegExp("(" + _.keys(entityMap.unescape).join("|") + ")", "g")
            };
            _.each(["escape", "unescape"], function(method) {
                _[method] = function(string) {
                    return null == string ? "" : ("" + string).replace(entityRegexes[method], function(match) {
                        return entityMap[method][match]
                    })
                }
            }), _.result = function(object, property) {
                if (null == object) return void 0;
                var value = object[property];
                return _.isFunction(value) ? value.call(object) : value
            }, _.mixin = function(obj) {
                each(_.functions(obj), function(name) {
                    var func = _[name] = obj[name];
                    _.prototype[name] = function() {
                        var args = [this._wrapped];
                        return push.apply(args, arguments), result.call(this, func.apply(_, args))
                    }
                })
            };
            var idCounter = 0;
            _.uniqueId = function(prefix) {
                var id = ++idCounter + "";
                return prefix ? prefix + id : id
            }, _.templateSettings = {
                evaluate: /<%([\s\S]+?)%>/g,
                interpolate: /<%=([\s\S]+?)%>/g,
                escape: /<%-([\s\S]+?)%>/g
            };
            var noMatch = /(.)^/,
                escapes = {
                    "'": "'",
                    "\\": "\\",
                    "\r": "r",
                    "\n": "n",
                    "	": "t",
                    "\u2028": "u2028",
                    "\u2029": "u2029"
                },
                escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
            _.template = function(text, data, settings) {
                var render;
                settings = _.defaults({}, settings, _.templateSettings);
                var matcher = new RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join("|") + "|$", "g"),
                    index = 0,
                    source = "__p+='";
                text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
                    return source += text.slice(index, offset).replace(escaper, function(match) {
                        return "\\" + escapes[match]
                    }), escape && (source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'"), interpolate && (source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'"), evaluate && (source += "';\n" + evaluate + "\n__p+='"), index = offset + match.length, match
                }), source += "';\n", settings.variable || (source = "with(obj||{}){\n" + source + "}\n"), source = "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";
                try {
                    render = new Function(settings.variable || "obj", "_", source)
                } catch (e) {
                    throw e.source = source, e
                }
                if (data) return render(data, _);
                var template = function(data) {
                    return render.call(this, data, _)
                };
                return template.source = "function(" + (settings.variable || "obj") + "){\n" + source + "}", template
            }, _.chain = function(obj) {
                return _(obj).chain()
            };
            var result = function(obj) {
                return this._chain ? _(obj).chain() : obj
            };
            _.mixin(_), each(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function(name) {
                var method = ArrayProto[name];
                _.prototype[name] = function() {
                    var obj = this._wrapped;
                    return method.apply(obj, arguments), "shift" != name && "splice" != name || 0 !== obj.length || delete obj[0], result.call(this, obj)
                }
            }), each(["concat", "join", "slice"], function(name) {
                var method = ArrayProto[name];
                _.prototype[name] = function() {
                    return result.call(this, method.apply(this._wrapped, arguments))
                }
            }), _.extend(_.prototype, {
                chain: function() {
                    return this._chain = !0, this
                },
                value: function() {
                    return this._wrapped
                }
            }), "function" == typeof define && define.amd && define("underscore", [], function() {
                return _
            })
        }).call(this)
    }, {}],
    108: [function(require, module) {
        function Collection(models, options) {
            if (options || (options = {}), options.model && (this.model = options.model), options.comparator && (this.comparator = options.comparator), options.parent && (this.parent = options.parent), !this.mainIndex) {
                var idAttribute = this.model && this.model.prototype && this.model.prototype.idAttribute;
                this.mainIndex = idAttribute || "id"
            }
            this._reset(), this.initialize.apply(this, arguments), models && this.reset(models, extend({
                silent: !0
            }, options))
        }
        var BackboneEvents = require("backbone-events-standalone"),
            classExtend = require("ampersand-class-extend"),
            isArray = require("is-array"),
            bind = require("amp-bind"),
            extend = require("extend-object"),
            slice = [].slice;
        extend(Collection.prototype, BackboneEvents, {
            initialize: function() {},
            indexes: [],
            isModel: function(model) {
                return this.model && model instanceof this.model
            },
            add: function(models, options) {
                return this.set(models, extend({
                    merge: !1,
                    add: !0,
                    remove: !1
                }, options))
            },
            parse: function(res) {
                return res
            },
            serialize: function() {
                return this.map(function(model) {
                    if (model.serialize) return model.serialize();
                    var out = {};
                    return extend(out, model), delete out.collection, out
                })
            },
            toJSON: function() {
                return this.serialize()
            },
            set: function(models, options) {
                options = extend({
                    add: !0,
                    remove: !0,
                    merge: !0
                }, options), options.parse && (models = this.parse(models, options));
                var singular = !isArray(models);
                models = singular ? models ? [models] : [] : models.slice();
                var id, model, attrs, existing, sort, i, length, at = options.at,
                    sortable = this.comparator && null == at && options.sort !== !1,
                    sortAttr = "string" == typeof this.comparator ? this.comparator : null,
                    toAdd = [],
                    toRemove = [],
                    modelMap = {},
                    add = options.add,
                    merge = options.merge,
                    remove = options.remove,
                    order = !sortable && add && remove ? [] : !1,
                    targetProto = this.model && this.model.prototype || Object.prototype;
                for (i = 0, length = models.length; length > i; i++) {
                    if (attrs = models[i] || {}, id = this.isModel(attrs) ? model = attrs : targetProto.generateId ? targetProto.generateId(attrs) : attrs[targetProto.idAttribute || this.mainIndex], existing = this.get(id)) remove && (modelMap[existing.cid || existing[this.mainIndex]] = !0), merge && (attrs = attrs === model ? model.attributes : attrs, options.parse && (attrs = existing.parse(attrs, options)), existing.set ? (existing.set(attrs, options), sortable && !sort && existing.hasChanged(sortAttr) && (sort = !0)) : extend(existing, attrs)), models[i] = existing;
                    else if (add) {
                        if (model = models[i] = this._prepareModel(attrs, options), !model) continue;
                        toAdd.push(model), this._addReference(model, options)
                    }
                    model = existing || model, model && (order && (model.isNew && model.isNew() || !model[this.mainIndex] || !modelMap[model.cid || model[this.mainIndex]]) && order.push(model), modelMap[model[this.mainIndex]] = !0)
                }
                if (remove) {
                    for (i = 0, length = this.length; length > i; i++) model = this.models[i], modelMap[model.cid || model[this.mainIndex]] || toRemove.push(model);
                    toRemove.length && this.remove(toRemove, options)
                }
                if (toAdd.length || order && order.length)
                    if (sortable && (sort = !0), null != at)
                        for (i = 0, length = toAdd.length; length > i; i++) this.models.splice(at + i, 0, toAdd[i]);
                    else {
                        var orderedModels = order || toAdd;
                        for (i = 0, length = orderedModels.length; length > i; i++) this.models.push(orderedModels[i])
                    }
                if (sort && this.sort({
                        silent: !0
                    }), !options.silent) {
                    for (i = 0, length = toAdd.length; length > i; i++) model = toAdd[i], model.trigger ? model.trigger("add", model, this, options) : this.trigger("add", model, this, options);
                    (sort || order && order.length) && this.trigger("sort", this, options)
                }
                return singular ? models[0] : models
            },
            get: function(query, indexName) {
                if (query) {
                    var index = this._indexes[indexName || this.mainIndex];
                    return index[query] || index[query[this.mainIndex]] || this._indexes.cid[query] || this._indexes.cid[query.cid]
                }
            },
            at: function(index) {
                return this.models[index]
            },
            remove: function(models, options) {
                var i, length, model, index, singular = !isArray(models);
                for (models = singular ? [models] : slice.call(models), options || (options = {}), i = 0, length = models.length; length > i; i++) model = models[i] = this.get(models[i]), model && (this._deIndex(model), index = this.models.indexOf(model), this.models.splice(index, 1), options.silent || (options.index = index, model.trigger ? model.trigger("remove", model, this, options) : this.trigger("remove", model, this, options)), this._removeReference(model, options));
                return singular ? models[0] : models
            },
            reset: function(models, options) {
                options || (options = {});
                for (var i = 0, length = this.models.length; length > i; i++) this._removeReference(this.models[i], options);
                return options.previousModels = this.models, this._reset(), models = this.add(models, extend({
                    silent: !0
                }, options)), options.silent || this.trigger("reset", this, options), models
            },
            sort: function(options) {
                var self = this;
                if (!this.comparator) throw new Error("Cannot sort a set without a comparator");
                return options || (options = {}), this.models.sort("string" == typeof this.comparator ? function(left, right) {
                    return left.get ? (left = left.get(self.comparator), right = right.get(self.comparator)) : (left = left[self.comparator], right = right[self.comparator]), left > right || void 0 === left ? 1 : right > left || void 0 === right ? -1 : 0
                } : 1 === this.comparator.length ? function(left, right) {
                    return left = self.comparator(left), right = self.comparator(right), left > right || void 0 === left ? 1 : right > left || void 0 === right ? -1 : 0
                } : bind(this.comparator, this)), options.silent || this.trigger("sort", this, options), this
            },
            _reset: function() {
                var list = this.indexes || [],
                    i = 0;
                list.push(this.mainIndex), list.push("cid");
                var l = list.length;
                for (this.models = [], this._indexes = {}; l > i; i++) this._indexes[list[i]] = {}
            },
            _prepareModel: function(attrs, options) {
                if (!this.model) return attrs;
                if (this.isModel(attrs)) return attrs.collection || (attrs.collection = this), attrs;
                options = options ? extend({}, options) : {}, options.collection = this;
                var model = new this.model(attrs, options);
                return model.validationError ? (this.trigger("invalid", this, model.validationError, options), !1) : model
            },
            _deIndex: function(model) {
                for (var name in this._indexes) delete this._indexes[name][model[name] || model.get && model.get(name)]
            },
            _index: function(model) {
                for (var name in this._indexes) {
                    var indexVal = model[name] || model.get && model.get(name);
                    indexVal && (this._indexes[name][indexVal] = model)
                }
            },
            _addReference: function(model) {
                this._index(model), model.collection || (model.collection = this), model.on && model.on("all", this._onModelEvent, this)
            },
            _removeReference: function(model) {
                this === model.collection && delete model.collection, this._deIndex(model), model.off && model.off("all", this._onModelEvent, this)
            },
            _onModelEvent: function(event, model, collection, options) {
                ("add" !== event && "remove" !== event || collection === this) && ("destroy" === event && this.remove(model, options), model && event === "change:" + this.mainIndex && (this._deIndex(model), this._index(model)), this.trigger.apply(this, arguments))
            }
        }), Object.defineProperties(Collection.prototype, {
            length: {
                get: function() {
                    return this.models.length
                }
            },
            isCollection: {
                value: !0
            }
        });
        var arrayMethods = ["indexOf", "lastIndexOf", "every", "some", "forEach", "map", "filter", "reduce", "reduceRight"];
        arrayMethods.forEach(function(method) {
            Collection.prototype[method] = function() {
                return this.models[method].apply(this.models, arguments)
            }
        }), Collection.prototype.each = Collection.prototype.forEach, Collection.extend = classExtend, module.exports = Collection
    }, {
        "amp-bind": 109,
        "ampersand-class-extend": 104,
        "backbone-events-standalone": 113,
        "extend-object": 114,
        "is-array": 115
    }],
    109: [function(require, module, exports) {
        arguments[4][85][0].apply(exports, arguments)
    }, {
        "amp-is-function": 110,
        "amp-is-object": 111,
        dup: 85
    }],
    110: [function(require, module, exports) {
        arguments[4][67][0].apply(exports, arguments)
    }, {
        dup: 67
    }],
    111: [function(require, module, exports) {
        arguments[4][62][0].apply(exports, arguments)
    }, {
        dup: 62
    }],
    112: [function(require, module, exports) {
        ! function() {
            function miniscore() {
                return {
                    keys: Object.keys,
                    uniqueId: function(prefix) {
                        var id = ++idCounter + "";
                        return prefix ? prefix + id : id
                    },
                    has: function(obj, key) {
                        return hasOwnProperty.call(obj, key)
                    },
                    each: function(obj, iterator, context) {
                        if (null != obj)
                            if (nativeForEach && obj.forEach === nativeForEach) obj.forEach(iterator, context);
                            else if (obj.length === +obj.length) {
                            for (var i = 0, l = obj.length; l > i; i++)
                                if (iterator.call(context, obj[i], i, obj) === breaker) return
                        } else
                            for (var key in obj)
                                if (this.has(obj, key) && iterator.call(context, obj[key], key, obj) === breaker) return
                    },
                    once: function(func) {
                        var memo, ran = !1;
                        return function() {
                            return ran ? memo : (ran = !0, memo = func.apply(this, arguments), func = null, memo)
                        }
                    }
                }
            }
            var Events, root = this,
                breaker = {},
                nativeForEach = Array.prototype.forEach,
                hasOwnProperty = Object.prototype.hasOwnProperty,
                slice = Array.prototype.slice,
                idCounter = 0,
                _ = miniscore();
            Events = {
                on: function(name, callback, context) {
                    if (!eventsApi(this, "on", name, [callback, context]) || !callback) return this;
                    this._events || (this._events = {});
                    var events = this._events[name] || (this._events[name] = []);
                    return events.push({
                        callback: callback,
                        context: context,
                        ctx: context || this
                    }), this
                },
                once: function(name, callback, context) {
                    if (!eventsApi(this, "once", name, [callback, context]) || !callback) return this;
                    var self = this,
                        once = _.once(function() {
                            self.off(name, once), callback.apply(this, arguments)
                        });
                    return once._callback = callback, this.on(name, once, context)
                },
                off: function(name, callback, context) {
                    var retain, ev, events, names, i, l, j, k;
                    if (!this._events || !eventsApi(this, "off", name, [callback, context])) return this;
                    if (!name && !callback && !context) return this._events = {}, this;
                    for (names = name ? [name] : _.keys(this._events), i = 0, l = names.length; l > i; i++)
                        if (name = names[i], events = this._events[name]) {
                            if (this._events[name] = retain = [], callback || context)
                                for (j = 0, k = events.length; k > j; j++) ev = events[j], (callback && callback !== ev.callback && callback !== ev.callback._callback || context && context !== ev.context) && retain.push(ev);
                            retain.length || delete this._events[name]
                        }
                    return this
                },
                trigger: function(name) {
                    if (!this._events) return this;
                    var args = slice.call(arguments, 1);
                    if (!eventsApi(this, "trigger", name, args)) return this;
                    var events = this._events[name],
                        allEvents = this._events.all;
                    return events && triggerEvents(events, args), allEvents && triggerEvents(allEvents, arguments), this
                },
                stopListening: function(obj, name, callback) {
                    var listeners = this._listeners;
                    if (!listeners) return this;
                    var deleteListener = !name && !callback;
                    "object" == typeof name && (callback = this), obj && ((listeners = {})[obj._listenerId] = obj);
                    for (var id in listeners) listeners[id].off(name, callback, this), deleteListener && delete this._listeners[id];
                    return this
                }
            };
            var eventSplitter = /\s+/,
                eventsApi = function(obj, action, name, rest) {
                    if (!name) return !0;
                    if ("object" == typeof name) {
                        for (var key in name) obj[action].apply(obj, [key, name[key]].concat(rest));
                        return !1
                    }
                    if (eventSplitter.test(name)) {
                        for (var names = name.split(eventSplitter), i = 0, l = names.length; l > i; i++) obj[action].apply(obj, [names[i]].concat(rest));
                        return !1
                    }
                    return !0
                },
                triggerEvents = function(events, args) {
                    var ev, i = -1,
                        l = events.length,
                        a1 = args[0],
                        a2 = args[1],
                        a3 = args[2];
                    switch (args.length) {
                        case 0:
                            for (; ++i < l;)(ev = events[i]).callback.call(ev.ctx);
                            return;
                        case 1:
                            for (; ++i < l;)(ev = events[i]).callback.call(ev.ctx, a1);
                            return;
                        case 2:
                            for (; ++i < l;)(ev = events[i]).callback.call(ev.ctx, a1, a2);
                            return;
                        case 3:
                            for (; ++i < l;)(ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
                            return;
                        default:
                            for (; ++i < l;)(ev = events[i]).callback.apply(ev.ctx, args)
                    }
                },
                listenMethods = {
                    listenTo: "on",
                    listenToOnce: "once"
                };
            _.each(listenMethods, function(implementation, method) {
                Events[method] = function(obj, name, callback) {
                    var listeners = this._listeners || (this._listeners = {}),
                        id = obj._listenerId || (obj._listenerId = _.uniqueId("l"));
                    return listeners[id] = obj, "object" == typeof name && (callback = this), obj[implementation](name, callback, this), this
                }
            }), Events.bind = Events.on, Events.unbind = Events.off, Events.mixin = function(proto) {
                var exports = ["on", "once", "off", "trigger", "stopListening", "listenTo", "listenToOnce", "bind", "unbind"];
                return _.each(exports, function(name) {
                    proto[name] = this[name]
                }, this), proto
            }, "function" == typeof define ? define(function() {
                return Events
            }) : "undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = Events), exports.BackboneEvents = Events) : root.BackboneEvents = Events
        }(this)
    }, {}],
    113: [function(require, module) {
        module.exports = require("./backbone-events-standalone")
    }, {
        "./backbone-events-standalone": 112
    }],
    114: [function(require, module, exports) {
        arguments[4][105][0].apply(exports, arguments)
    }, {
        dup: 105
    }],
    115: [function(require, module) {
        var isArray = Array.isArray,
            str = Object.prototype.toString;
        module.exports = isArray || function(val) {
            return !!val && "[object Array]" == str.call(val)
        }
    }, {}],
    116: [function(require, module) {
        function getString(val) {
            return val || 0 === val ? val : ""
        }

        function hasClass(el, cls) {
            return el.classList ? el.classList.contains(cls) : new RegExp("(^| )" + cls + "( |$)", "gi").test(el.className)
        }

        function hasBooleanProperty(el, prop) {
            var val = el[prop];
            return prop in el && (val === !0 || val === !1)
        }

        function isHidden(el) {
            return "true" === dom.getAttribute(el, "data-anddom-hidden")
        }

        function storeDisplayStyle(el) {
            dom.setAttribute(el, "data-anddom-display", el.style.display)
        }

        function show(el) {
            el.style.display = dom.getAttribute(el, "data-anddom-display") || "", dom.removeAttribute(el, "data-anddom-hidden")
        }

        function hide(el) {
            dom.setAttribute(el, "data-anddom-hidden", "true"), el.style.display = "none"
        }
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-dom"] = window.ampersand["ampersand-dom"] || [], window.ampersand["ampersand-dom"].push("1.2.7"));
        var dom = module.exports = {
            text: function(el, val) {
                el.textContent = getString(val)
            },
            addClass: function(el, cls) {
                cls = getString(cls), cls && (Array.isArray(cls) ? cls.forEach(function(c) {
                    dom.addClass(el, c)
                }) : el.classList ? el.classList.add(cls) : hasClass(el, cls) || (el.classList ? el.classList.add(cls) : el.className += " " + cls))
            },
            removeClass: function(el, cls) {
                Array.isArray(cls) ? cls.forEach(function(c) {
                    dom.removeClass(el, c)
                }) : el.classList ? (cls = getString(cls), cls && el.classList.remove(cls)) : el.className = el.className.replace(new RegExp("(^|\\b)" + cls.split(" ").join("|") + "(\\b|$)", "gi"), " ")
            },
            hasClass: hasClass,
            switchClass: function(el, prevCls, newCls) {
                prevCls && this.removeClass(el, prevCls), this.addClass(el, newCls)
            },
            addAttribute: function(el, attr) {
                el.setAttribute(attr, ""), hasBooleanProperty(el, attr) && (el[attr] = !0)
            },
            removeAttribute: function(el, attr) {
                el.removeAttribute(attr), hasBooleanProperty(el, attr) && (el[attr] = !1)
            },
            setAttribute: function(el, attr, value) {
                el.setAttribute(attr, getString(value))
            },
            getAttribute: function(el, attr) {
                return el.getAttribute(attr)
            },
            hide: function(el) {
                isHidden(el) || (storeDisplayStyle(el), hide(el))
            },
            show: function(el) {
                show(el)
            },
            html: function(el, content) {
                el.innerHTML = content
            }
        }
    }, {}],
    117: [function(require, module) {
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-model"] = window.ampersand["ampersand-model"] || [], window.ampersand["ampersand-model"].push("4.1.0"));
        var State = require("ampersand-state"),
            _ = require("underscore"),
            sync = require("ampersand-sync"),
            Model = State.extend({
                save: function(key, val, options) {
                    {
                        var attrs, method, sync;
                        this.attributes
                    }
                    if (null == key || "object" == typeof key ? (attrs = key, options = val) : (attrs = {})[key] = val, options = _.extend({
                            validate: !0
                        }, options), attrs && !options.wait) {
                        if (!this.set(attrs, options)) return !1
                    } else if (!this._validate(attrs, options)) return !1;
                    void 0 === options.parse && (options.parse = !0);
                    var model = this,
                        success = options.success;
                    return options.success = function(resp) {
                        var serverAttrs = model.parse(resp, options);
                        return options.wait && (serverAttrs = _.extend(attrs || {}, serverAttrs)), _.isObject(serverAttrs) && !model.set(serverAttrs, options) ? !1 : (success && success(model, resp, options), void model.trigger("sync", model, resp, options))
                    }, wrapError(this, options), method = this.isNew() ? "create" : options.patch ? "patch" : "update", "patch" === method && (options.attrs = attrs), options.wait && (options.attrs = _.extend(model.serialize(), attrs)), sync = this.sync(method, this, options)
                },
                fetch: function(options) {
                    options = options ? _.clone(options) : {}, void 0 === options.parse && (options.parse = !0);
                    var model = this,
                        success = options.success;
                    return options.success = function(resp) {
                        return model.set(model.parse(resp, options), options) ? (success && success(model, resp, options), void model.trigger("sync", model, resp, options)) : !1
                    }, wrapError(this, options), this.sync("read", this, options)
                },
                destroy: function(options) {
                    options = options ? _.clone(options) : {};
                    var model = this,
                        success = options.success,
                        destroy = function() {
                            model.trigger("destroy", model, model.collection, options)
                        };
                    if (options.success = function(resp) {
                            (options.wait || model.isNew()) && destroy(), success && success(model, resp, options), model.isNew() || model.trigger("sync", model, resp, options)
                        }, this.isNew()) return options.success(), !1;
                    wrapError(this, options);
                    var sync = this.sync("delete", this, options);
                    return options.wait || destroy(), sync
                },
                sync: function() {
                    return sync.apply(this, arguments)
                },
                url: function() {
                    var base = _.result(this, "urlRoot") || _.result(this.collection, "url") || urlError();
                    return this.isNew() ? base : base + ("/" === base.charAt(base.length - 1) ? "" : "/") + encodeURIComponent(this.getId())
                }
            }),
            urlError = function() {
                throw new Error('A "url" property or function must be specified')
            },
            wrapError = function(model, options) {
                var error = options.error;
                options.error = function(resp) {
                    error && error(model, resp, options), model.trigger("error", model, resp, options)
                }
            };
        module.exports = Model
    }, {
        "ampersand-state": 118,
        "ampersand-sync": 123,
        underscore: 189
    }],
    118: [function(require, module) {
        function Base(attrs, options) {
            options || (options = {}), this.cid || (this.cid = _.uniqueId("state")), this._events = {}, this._values = {}, this._definition = Object.create(this._definition), options.parse && (attrs = this.parse(attrs, options)), this.parent = options.parent, this.collection = options.collection, this._keyTree = new KeyTree, this._initCollections(), this._initChildren(), this._cache = {}, this._previousAttributes = {}, attrs && this.set(attrs, _.extend({
                silent: !0,
                initial: !0
            }, options)), this._changed = {}, this._derived && this._initDerived(), options.init !== !1 && this.initialize.apply(this, arguments)
        }

        function createPropertyDefinition(object, name, desc, isSession) {
            var type, descArray, def = object._definition[name] = {};
            if (_.isString(desc)) type = object._ensureValidType(desc), type && (def.type = type);
            else {
                if (_.isArray(desc) && (descArray = desc, desc = {
                        type: descArray[0],
                        required: descArray[1],
                        "default": descArray[2]
                    }), type = object._ensureValidType(desc.type), type && (def.type = type), desc.required && (def.required = !0), desc["default"] && "object" == typeof desc["default"]) throw new TypeError("The default value for " + name + " cannot be an object/array, must be a value or a function which returns a value/object/array");
                def["default"] = desc["default"], def.allowNull = desc.allowNull ? desc.allowNull : !1, desc.setOnce && (def.setOnce = !0), def.required && _.isUndefined(def["default"]) && !def.setOnce && (def["default"] = object._getDefaultForType(type)), def.test = desc.test, def.values = desc.values
            }
            return isSession && (def.session = !0), Object.defineProperty(object, name, {
                set: function(val) {
                    this.set(name, val)
                },
                get: function() {
                    var result = this._values[name],
                        typeDef = this._dataTypes[def.type];
                    return "undefined" != typeof result ? (typeDef && typeDef.get && (result = typeDef.get(result)), result) : (result = _.result(def, "default"), this._values[name] = result, result)
                }
            }), def
        }

        function createDerivedProperty(modelProto, name, definition) {
            var def = modelProto._derived[name] = {
                fn: _.isFunction(definition) ? definition : definition.fn,
                cache: definition.cache !== !1,
                depList: definition.deps || []
            };
            _.each(def.depList, function(dep) {
                modelProto._deps[dep] = _(modelProto._deps[dep] || []).union([name])
            }), Object.defineProperty(modelProto, name, {
                get: function() {
                    return this._getDerivedProperty(name)
                },
                set: function() {
                    throw new TypeError('"' + name + "\" is a derived property, it can't be set directly.")
                }
            })
        }

        function extend(protoProps) {
            var child, parent = this,
                args = [].slice.call(arguments);

            child = protoProps && protoProps.hasOwnProperty("constructor") ? protoProps.constructor : function() {
                return parent.apply(this, arguments)
            }, _.extend(child, parent);
            var Surrogate = function() {
                this.constructor = child
            };
            Surrogate.prototype = parent.prototype, child.prototype = new Surrogate, child.prototype._derived = _.extend({}, parent.prototype._derived), child.prototype._deps = _.extend({}, parent.prototype._deps), child.prototype._definition = _.extend({}, parent.prototype._definition), child.prototype._collections = _.extend({}, parent.prototype._collections), child.prototype._children = _.extend({}, parent.prototype._children), child.prototype._dataTypes = _.extend({}, parent.prototype._dataTypes || dataTypes), protoProps && args.forEach(function(def) {
                var omitFromExtend = ["dataTypes", "props", "session", "derived", "collections", "children"];
                def.dataTypes && _.each(def.dataTypes, function(def, name) {
                    child.prototype._dataTypes[name] = def
                }), def.props && _.each(def.props, function(def, name) {
                    createPropertyDefinition(child.prototype, name, def)
                }), def.session && _.each(def.session, function(def, name) {
                    createPropertyDefinition(child.prototype, name, def, !0)
                }), def.derived && _.each(def.derived, function(def, name) {
                    createDerivedProperty(child.prototype, name, def)
                }), def.collections && _.each(def.collections, function(constructor, name) {
                    child.prototype._collections[name] = constructor
                }), def.children && _.each(def.children, function(constructor, name) {
                    child.prototype._children[name] = constructor
                }), _.extend(child.prototype, _.omit(def, omitFromExtend))
            });
            Object.prototype.toString;
            return child.__super__ = parent.prototype, child
        }
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-state"] = window.ampersand["ampersand-state"] || [], window.ampersand["ampersand-state"].push("4.4.5"));
        var _ = require("underscore"),
            BBEvents = require("backbone-events-standalone"),
            KeyTree = require("key-tree-store"),
            arrayNext = require("array-next"),
            changeRE = /^change:/;
        _.extend(Base.prototype, BBEvents, {
            extraProperties: "ignore",
            idAttribute: "id",
            namespaceAttribute: "namespace",
            typeAttribute: "modelType",
            initialize: function() {
                return this
            },
            getId: function() {
                return this[this.idAttribute]
            },
            getNamespace: function() {
                return this[this.namespaceAttribute]
            },
            getType: function() {
                return this[this.typeAttribute]
            },
            isNew: function() {
                return null == this.getId()
            },
            escape: function(attr) {
                return _.escape(this.get(attr))
            },
            isValid: function(options) {
                return this._validate({}, _.extend(options || {}, {
                    validate: !0
                }))
            },
            parse: function(resp) {
                return resp
            },
            serialize: function() {
                var res = this.getAttributes({
                    props: !0
                }, !0);
                return _.each(this._children, function(value, key) {
                    res[key] = this[key].serialize()
                }, this), _.each(this._collections, function(value, key) {
                    res[key] = this[key].serialize()
                }, this), res
            },
            set: function(key, value, options) {
                var changing, changes, newType, newVal, def, cast, err, attr, attrs, dataType, silent, unset, currentVal, initial, hasChanged, isEqual, self = this,
                    extraProperties = this.extraProperties;
                if (_.isObject(key) || null === key ? (attrs = key, options = value) : (attrs = {}, attrs[key] = value), options = options || {}, !this._validate(attrs, options)) return !1;
                unset = options.unset, silent = options.silent, initial = options.initial, changes = [], changing = this._changing, this._changing = !0, changing || (this._previousAttributes = this.attributes, this._changed = {});
                for (attr in attrs) {
                    if (newVal = attrs[attr], newType = typeof newVal, currentVal = this._values[attr], def = this._definition[attr], !def) {
                        if (this._children[attr] || this._collections[attr]) {
                            this[attr].set(newVal, options);
                            continue
                        }
                        if ("ignore" === extraProperties) continue;
                        if ("reject" === extraProperties) throw new TypeError('No "' + attr + '" property defined on ' + (this.type || "this") + ' model and extraProperties not set to "ignore" or "allow"');
                        if ("allow" === extraProperties) def = this._createPropertyDefinition(attr, "any");
                        else if (extraProperties) throw new TypeError('Invalid value for extraProperties: "' + extraProperties + '"')
                    }
                    if (isEqual = this._getCompareForType(def.type), dataType = this._dataTypes[def.type], dataType && dataType.set && (cast = dataType.set(newVal), newVal = cast.val, newType = cast.type), def.test && (err = def.test.call(this, newVal, newType))) throw new TypeError("Property '" + attr + "' failed validation with error: " + err);
                    if (_.isUndefined(newVal) && def.required) throw new TypeError("Required property '" + attr + "' must be of type " + def.type + ". Tried to set " + newVal);
                    if (_.isNull(newVal) && def.required && !def.allowNull) throw new TypeError("Property '" + attr + "' must be of type " + def.type + " (cannot be null). Tried to set " + newVal);
                    if (def.type && "any" !== def.type && def.type !== newType && !_.isNull(newVal) && !_.isUndefined(newVal)) throw new TypeError("Property '" + attr + "' must be of type " + def.type + ". Tried to set " + newVal);
                    if (def.values && !_.contains(def.values, newVal)) throw new TypeError("Property '" + attr + "' must be one of values: " + def.values.join(", ") + ". Tried to set " + newVal);
                    if (hasChanged = !isEqual(currentVal, newVal, attr), def.setOnce && void 0 !== currentVal && hasChanged && !initial) throw new TypeError("Property '" + attr + "' can only be set once.");
                    hasChanged ? (changes.push({
                        prev: currentVal,
                        val: newVal,
                        key: attr
                    }), self._changed[attr] = newVal) : delete self._changed[attr]
                }
                if (_.each(changes, function(change) {
                        self._previousAttributes[change.key] = change.prev, unset ? delete self._values[change.key] : self._values[change.key] = change.val
                    }), !silent && changes.length && (self._pending = !0), silent || _.each(changes, function(change) {
                        self.trigger("change:" + change.key, self, change.val, options)
                    }), changing) return this;
                if (!silent)
                    for (; this._pending;) this._pending = !1, this.trigger("change", this, options);
                return this._pending = !1, this._changing = !1, this
            },
            get: function(attr) {
                return this[attr]
            },
            toggle: function(property) {
                var def = this._definition[property];
                if ("boolean" === def.type) this[property] = !this[property];
                else {
                    if (!def || !def.values) throw new TypeError("Can only toggle properties that are type `boolean` or have `values` array.");
                    this[property] = arrayNext(def.values, this[property])
                }
                return this
            },
            previousAttributes: function() {
                return _.clone(this._previousAttributes)
            },
            hasChanged: function(attr) {
                return null == attr ? !_.isEmpty(this._changed) : _.has(this._changed, attr)
            },
            changedAttributes: function(diff) {
                if (!diff) return this.hasChanged() ? _.clone(this._changed) : !1;
                var val, def, isEqual, changed = !1,
                    old = this._changing ? this._previousAttributes : this.attributes;
                for (var attr in diff) def = this._definition[attr], def && (isEqual = this._getCompareForType(def.type), isEqual(old[attr], val = diff[attr]) || ((changed || (changed = {}))[attr] = val));
                return changed
            },
            toJSON: function() {
                return this.serialize()
            },
            unset: function(attr, options) {
                {
                    var val, def = this._definition[attr];
                    def.type
                }
                return def.required ? (val = _.result(def, "default"), this.set(attr, val, options)) : this.set(attr, val, _.extend({}, options, {
                    unset: !0
                }))
            },
            clear: function(options) {
                var self = this;
                return _.each(_.keys(this.attributes), function(key) {
                    self.unset(key, options)
                }), this
            },
            previous: function(attr) {
                return null != attr && Object.keys(this._previousAttributes).length ? this._previousAttributes[attr] : null
            },
            _getDefaultForType: function(type) {
                var dataType = this._dataTypes[type];
                return dataType && dataType["default"]
            },
            _getCompareForType: function(type) {
                var dataType = this._dataTypes[type];
                return dataType && dataType.compare ? _.bind(dataType.compare, this) : _.isEqual
            },
            _validate: function(attrs, options) {
                if (!options.validate || !this.validate) return !0;
                attrs = _.extend({}, this.attributes, attrs);
                var error = this.validationError = this.validate(attrs, options) || null;
                return error ? (this.trigger("invalid", this, error, _.extend(options || {}, {
                    validationError: error
                })), !1) : !0
            },
            _createPropertyDefinition: function(name, desc, isSession) {
                return createPropertyDefinition(this, name, desc, isSession)
            },
            _ensureValidType: function(type) {
                return _.contains(["string", "number", "boolean", "array", "object", "date", "any"].concat(_.keys(this._dataTypes)), type) ? type : void 0
            },
            getAttributes: function(options, raw) {
                options || (options = {}), _.defaults(options, {
                    session: !1,
                    props: !1,
                    derived: !1
                });
                var val, item, def, res = {};
                for (item in this._definition) def = this._definition[item], (options.session && def.session || options.props && !def.session) && (val = raw ? this._values[item] : this[item], "undefined" == typeof val && (val = _.result(def, "default")), "undefined" != typeof val && (res[item] = val));
                if (options.derived)
                    for (item in this._derived) res[item] = this[item];
                return res
            },
            _initDerived: function() {
                var self = this;
                _.each(this._derived, function(value, name) {
                    var def = self._derived[name];
                    def.deps = def.depList;
                    var update = function(options) {
                        options = options || {};
                        var newVal = def.fn.call(self);
                        self._cache[name] === newVal && def.cache || (def.cache && (self._previousAttributes[name] = self._cache[name]), self._cache[name] = newVal, self.trigger("change:" + name, self, self._cache[name]))
                    };
                    def.deps.forEach(function(propString) {
                        self._keyTree.add(propString, update)
                    })
                }), this.on("all", function(eventName) {
                    changeRE.test(eventName) && self._keyTree.get(eventName.split(":")[1]).forEach(function(fn) {
                        fn()
                    })
                }, this)
            },
            _getDerivedProperty: function(name, flushCache) {
                return this._derived[name].cache ? ((flushCache || !this._cache.hasOwnProperty(name)) && (this._cache[name] = this._derived[name].fn.apply(this)), this._cache[name]) : this._derived[name].fn.apply(this)
            },
            _initCollections: function() {
                var coll;
                if (this._collections)
                    for (coll in this._collections) this[coll] = new this._collections[coll](null, {
                        parent: this
                    })
            },
            _initChildren: function() {
                var child;
                if (this._children)
                    for (child in this._children) this[child] = new this._children[child]({}, {
                        parent: this
                    }), this.listenTo(this[child], "all", this._getEventBubblingHandler(child))
            },
            _getEventBubblingHandler: function(propertyName) {
                return _.bind(function(name, model, newValue) {
                    changeRE.test(name) ? this.trigger("change:" + propertyName + "." + name.split(":")[1], model, newValue) : "change" === name && this.trigger("change", this)
                }, this)
            },
            _verifyRequired: function() {
                var attrs = this.attributes;
                for (var def in this._definition)
                    if (this._definition[def].required && "undefined" == typeof attrs[def]) return !1;
                return !0
            }
        }), Object.defineProperties(Base.prototype, {
            attributes: {
                get: function() {
                    return this.getAttributes({
                        props: !0,
                        session: !0
                    })
                }
            },
            all: {
                get: function() {
                    return this.getAttributes({
                        session: !0,
                        props: !0,
                        derived: !0
                    })
                }
            },
            isState: {
                get: function() {
                    return !0
                },
                set: function() {}
            }
        });
        var dataTypes = {
            string: {
                "default": function() {
                    return ""
                }
            },
            date: {
                set: function(newVal) {
                    var newType;
                    if (null == newVal) newType = "object";
                    else if (_.isDate(newVal)) newType = "date", newVal = newVal.valueOf();
                    else try {
                        var dateVal = new Date(newVal).valueOf();
                        if (isNaN(dateVal) && (dateVal = new Date(parseInt(newVal, 10)).valueOf(), isNaN(dateVal))) throw TypeError;
                        newVal = dateVal, newType = "date"
                    } catch (e) {
                        newType = typeof newVal
                    }
                    return {
                        val: newVal,
                        type: newType
                    }
                },
                get: function(val) {
                    return null == val ? val : new Date(val)
                },
                "default": function() {
                    return new Date
                }
            },
            array: {
                set: function(newVal) {
                    return {
                        val: newVal,
                        type: _.isArray(newVal) ? "array" : typeof newVal
                    }
                },
                "default": function() {
                    return []
                }
            },
            object: {
                set: function(newVal) {
                    var newType = typeof newVal;
                    return "object" !== newType && _.isUndefined(newVal) && (newVal = null, newType = "object"), {
                        val: newVal,
                        type: newType
                    }
                },
                "default": function() {
                    return {}
                }
            },
            state: {
                set: function(newVal) {
                    var isInstance = newVal instanceof Base || newVal && newVal.isState;
                    return isInstance ? {
                        val: newVal,
                        type: "state"
                    } : {
                        val: newVal,
                        type: typeof newVal
                    }
                },
                compare: function(currentVal, newVal, attributeName) {
                    var isSame = currentVal === newVal;
                    return isSame || (currentVal && this.stopListening(currentVal), null != newVal && this.listenTo(newVal, "all", this._getEventBubblingHandler(attributeName))), isSame
                }
            }
        };
        Base.extend = extend, module.exports = Base
    }, {
        "array-next": 119,
        "backbone-events-standalone": 121,
        "key-tree-store": 122,
        underscore: 189
    }],
    119: [function(require, module) {
        module.exports = function(array, currentItem) {
            var len = array.length,
                newIndex = array.indexOf(currentItem) + 1;
            return newIndex > len - 1 && (newIndex = 0), array[newIndex]
        }
    }, {}],
    120: [function(require, module, exports) {
        arguments[4][112][0].apply(exports, arguments)
    }, {
        dup: 112
    }],
    121: [function(require, module, exports) {
        arguments[4][113][0].apply(exports, arguments)
    }, {
        "./backbone-events-standalone": 120,
        dup: 113
    }],
    122: [function(require, module) {
        function KeyTreeStore() {
            this.storage = {}
        }
        KeyTreeStore.prototype.add = function(keypath, obj) {
            var arr = this.storage[keypath] || (this.storage[keypath] = []);
            arr.push(obj)
        }, KeyTreeStore.prototype.remove = function(obj) {
            var path, arr;
            for (path in this.storage) arr = this.storage[path], arr.some(function(item, index) {
                return item === obj ? (arr.splice(index, 1), !0) : void 0
            })
        }, KeyTreeStore.prototype.get = function(keypath) {
            var key, res = [];
            for (key in this.storage)(keypath === key || 0 === key.indexOf(keypath + ".")) && (res = res.concat(this.storage[key]));
            return res
        }, module.exports = KeyTreeStore
    }, {}],
    123: [function(require, module) {
        var _ = require("underscore"),
            xhr = require("xhr"),
            qs = require("qs"),
            urlError = function() {
                throw new Error('A "url" property or function must be specified')
            };
        module.exports = function(method, model, options) {
            var type = methodMap[method],
                headers = {};
            _.defaults(options || (options = {}), {
                emulateHTTP: !1,
                emulateJSON: !1
            });
            var params = {
                type: type
            };
            options.url || (params.url = _.result(model, "url") || urlError()), null != options.data || !model || "create" !== method && "update" !== method && "patch" !== method || (params.json = options.attrs || model.toJSON(options)), options.data && "GET" === type && (params.url += _.contains(params.url, "?") ? "&" : "?", params.url += qs.stringify(options.data)), options.emulateJSON && (headers["Content-Type"] = "application/x-www-form-urlencoded", params.body = params.json ? {
                model: params.json
            } : {}, delete params.json), !options.emulateHTTP || "PUT" !== type && "DELETE" !== type && "PATCH" !== type || (params.type = "POST", options.emulateJSON && (params.body._method = type), headers["X-HTTP-Method-Override"] = type), options.emulateJSON && (params.body = qs.stringify(params.body));
            var ajaxConfig = _.result(model, "ajaxConfig") || {};
            if (ajaxConfig.headers && _.extend(headers, ajaxConfig.headers), params.headers = headers, ajaxConfig.useXDR && (params.useXDR = !0), ajaxConfig.xhrFields) {
                var beforeSend = ajaxConfig.beforeSend;
                params.beforeSend = function(req) {
                    for (var key in ajaxConfig.xhrFields) req[key] = ajaxConfig.xhrFields[key];
                    return beforeSend ? beforeSend.apply(this, arguments) : void 0
                }, params.xhrFields = ajaxConfig.xhrFields
            }
            params.method = params.type;
            var ajaxSettings = _.extend(params, options),
                request = options.xhr = xhr(ajaxSettings, function(err, resp, body) {
                    if (err && options.error) return options.error(resp, "error", err.message);
                    if (body && "string" == typeof body) try {
                        body = JSON.parse(body)
                    } catch (e) {}
                    return options.success ? options.success(body, "success", resp) : void 0
                });
            return model.trigger("request", model, request, options, ajaxSettings), request.ajaxSettings = ajaxSettings, request
        };
        var methodMap = {
            create: "POST",
            update: "PUT",
            patch: "PATCH",
            "delete": "DELETE",
            read: "GET"
        }
    }, {
        qs: 124,
        underscore: 129,
        xhr: 190
    }],
    124: [function(require, module) {
        module.exports = require("./lib")
    }, {
        "./lib": 125
    }],
    125: [function(require, module) {
        var Stringify = require("./stringify"),
            Parse = require("./parse");
        module.exports = {
            stringify: Stringify,
            parse: Parse
        }
    }, {
        "./parse": 126,
        "./stringify": 127
    }],
    126: [function(require, module) {
        var Utils = require("./utils"),
            internals = {
                delimiter: "&",
                depth: 5,
                arrayLimit: 20,
                parametersLimit: 1e3
            };
        internals.parseValues = function(str, delimiter) {
            delimiter = "string" == typeof delimiter ? delimiter : internals.delimiter;
            for (var obj = {}, parts = str.split(delimiter, internals.parametersLimit), i = 0, il = parts.length; il > i; ++i) {
                var part = parts[i],
                    pos = -1 === part.indexOf("]=") ? part.indexOf("=") : part.indexOf("]=") + 1;
                if (-1 === pos) obj[Utils.decode(part)] = "";
                else {
                    var key = Utils.decode(part.slice(0, pos)),
                        val = Utils.decode(part.slice(pos + 1));
                    obj[key] = obj[key] ? [].concat(obj[key]).concat(val) : val
                }
            }
            return obj
        }, internals.parseObject = function(chain, val) {
            if (!chain.length) return val;
            var root = chain.shift(),
                obj = {};
            if ("[]" === root) obj = [], obj = obj.concat(internals.parseObject(chain, val));
            else {
                var cleanRoot = "[" === root[0] && "]" === root[root.length - 1] ? root.slice(1, root.length - 1) : root,
                    index = parseInt(cleanRoot, 10);
                !isNaN(index) && root !== cleanRoot && index <= internals.arrayLimit ? (obj = [], obj[index] = internals.parseObject(chain, val)) : obj[cleanRoot] = internals.parseObject(chain, val)
            }
            return obj
        }, internals.parseKeys = function(key, val, depth) {
            if (key) {
                var parent = /^([^\[\]]*)/,
                    child = /(\[[^\[\]]*\])/g,
                    segment = parent.exec(key);
                if (!Object.prototype.hasOwnProperty(segment[1])) {
                    var keys = [];
                    segment[1] && keys.push(segment[1]);
                    for (var i = 0; null !== (segment = child.exec(key)) && depth > i;) ++i, Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, "")) || keys.push(segment[1]);
                    return segment && keys.push("[" + key.slice(segment.index) + "]"), internals.parseObject(keys, val)
                }
            }
        }, module.exports = function(str, depth, delimiter) {
            if ("" === str || null === str || "undefined" == typeof str) return {};
            "number" != typeof depth && (delimiter = depth, depth = internals.depth);
            var tempObj = "string" == typeof str ? internals.parseValues(str, delimiter) : Utils.clone(str),
                obj = {};
            for (var key in tempObj)
                if (tempObj.hasOwnProperty(key)) {
                    var newObj = internals.parseKeys(key, tempObj[key], depth);
                    obj = Utils.merge(obj, newObj)
                }
            return Utils.compact(obj)
        }
    }, {
        "./utils": 128
    }],
    127: [function(require, module) {
        (function(Buffer) {
            var internals = {
                delimiter: "&"
            };
            internals.stringify = function(obj, prefix) {
                if (Buffer.isBuffer(obj) ? obj = obj.toString() : obj instanceof Date ? obj = obj.toISOString() : null === obj && (obj = ""), "string" == typeof obj || "number" == typeof obj || "boolean" == typeof obj) return [encodeURIComponent(prefix) + "=" + encodeURIComponent(obj)];
                var values = [];
                for (var key in obj) obj.hasOwnProperty(key) && (values = values.concat(internals.stringify(obj[key], prefix + "[" + key + "]")));
                return values
            }, module.exports = function(obj, delimiter) {
                delimiter = "undefined" == typeof delimiter ? internals.delimiter : delimiter;
                var keys = [];
                for (var key in obj) obj.hasOwnProperty(key) && (keys = keys.concat(internals.stringify(obj[key], key)));
                return keys.join(delimiter)
            }
        }).call(this, require("buffer").Buffer)
    }, {
        buffer: 170
    }],
    128: [function(require, module, exports) {
        (function(Buffer) {
            exports.arrayToObject = function(source) {
                for (var obj = {}, i = 0, il = source.length; il > i; ++i) "undefined" != typeof source[i] && (obj[i] = source[i]);
                return obj
            }, exports.clone = function(source) {
                if ("object" != typeof source || null === source) return source;
                if (Buffer.isBuffer(source)) return source.toString();
                var obj = Array.isArray(source) ? [] : {};
                for (var i in source) source.hasOwnProperty(i) && (obj[i] = exports.clone(source[i]));
                return obj
            }, exports.merge = function(target, source) {
                if (!source) return target;
                var obj = exports.clone(target);
                if (Array.isArray(source)) {
                    for (var i = 0, il = source.length; il > i; ++i) "undefined" != typeof source[i] && (obj[i] = "object" == typeof obj[i] ? exports.merge(obj[i], source[i]) : source[i]);
                    return obj
                }
                Array.isArray(obj) && (obj = exports.arrayToObject(obj));
                for (var keys = Object.keys(source), k = 0, kl = keys.length; kl > k; ++k) {
                    var key = keys[k],
                        value = source[key];
                    obj[key] = value && "object" == typeof value ? obj[key] ? exports.merge(obj[key], value) : exports.clone(value) : value
                }
                return obj
            }, exports.decode = function(str) {
                try {
                    return decodeURIComponent(str.replace(/\+/g, " "))
                } catch (e) {
                    return str
                }
            }, exports.compact = function(obj) {
                if ("object" != typeof obj || null === obj) return obj;
                var compacted = {};
                for (var key in obj)
                    if (obj.hasOwnProperty(key))
                        if (Array.isArray(obj[key])) {
                            compacted[key] = [];
                            for (var i = 0, l = obj[key].length; l > i; i++) "undefined" != typeof obj[key][i] && compacted[key].push(obj[key][i])
                        } else compacted[key] = exports.compact(obj[key]);
                return compacted
            }
        }).call(this, require("buffer").Buffer)
    }, {
        buffer: 170
    }],
    129: [function(require, module, exports) {
        arguments[4][107][0].apply(exports, arguments)
    }, {
        dup: 107
    }],
    130: [function(require, module) {
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-rest-collection"] = window.ampersand["ampersand-rest-collection"] || [], window.ampersand["ampersand-rest-collection"].push("2.0.4"));
        var Collection = require("ampersand-collection"),
            underscoreMixin = require("ampersand-collection-underscore-mixin"),
            restMixins = require("ampersand-collection-rest-mixin");
        module.exports = Collection.extend(underscoreMixin, restMixins)
    }, {
        "ampersand-collection": 108,
        "ampersand-collection-rest-mixin": 131,
        "ampersand-collection-underscore-mixin": 140
    }],
    131: [function(require, module) {
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-collection-rest-mixin"] = window.ampersand["ampersand-collection-rest-mixin"] || [], window.ampersand["ampersand-collection-rest-mixin"].push("3.0.1"));
        var sync = require("ampersand-sync"),
            extend = require("extend-object"),
            wrapError = function(model, options) {
                var error = options.error;
                options.error = function(resp) {
                    error && error(model, resp, options), model.trigger("error", model, resp, options)
                }
            };
        module.exports = {
            fetch: function(options) {
                options = options ? extend({}, options) : {}, void 0 === options.parse && (options.parse = !0);
                var success = options.success,
                    collection = this;
                return options.success = function(resp) {
                    var method = options.reset ? "reset" : "set";
                    collection[method](resp, options), success && success(collection, resp, options), collection.trigger("sync", collection, resp, options)
                }, wrapError(this, options), this.sync("read", this, options)
            },
            create: function(model, options) {
                if (options = options ? extend({}, options) : {}, !(model = this._prepareModel(model, options))) return !1;
                options.wait || this.add(model, options);
                var collection = this,
                    success = options.success;
                return options.success = function(model, resp) {
                    options.wait && collection.add(model, options), success && success(model, resp, options)
                }, model.save(null, options), model
            },
            sync: function() {
                return sync.apply(this, arguments)
            },
            getOrFetch: function(id, options, cb) {
                function done() {
                    var model = self.get(id);
                    model ? cb && cb(null, model) : cb(new Error("not found"))
                }
                3 !== arguments.length && (cb = options, options = {});
                var self = this,
                    model = this.get(id);
                return model ? cb(null, model) : void(options.all ? this.fetch({
                    success: done,
                    error: done
                }) : this.fetchById(id, cb))
            },
            fetchById: function(id, cb) {
                var self = this,
                    idObj = {};
                idObj[this.model.prototype.idAttribute] = id;
                var model = new this.model(idObj, {
                    collection: this
                });
                model.fetch({
                    success: function() {
                        self.add(model), cb && cb(null, model)
                    },
                    error: function() {
                        delete model.collection, cb && cb(Error("not found"))
                    }
                })
            }
        }
    }, {
        "ampersand-sync": 132,
        "extend-object": 139
    }],
    132: [function(require, module, exports) {
        arguments[4][123][0].apply(exports, arguments)
    }, {
        dup: 123,
        qs: 133,
        underscore: 138,
        xhr: 190
    }],
    133: [function(require, module, exports) {
        arguments[4][124][0].apply(exports, arguments)
    }, {
        "./lib": 134,
        dup: 124
    }],
    134: [function(require, module, exports) {
        arguments[4][125][0].apply(exports, arguments)
    }, {
        "./parse": 135,
        "./stringify": 136,
        dup: 125
    }],
    135: [function(require, module, exports) {
        arguments[4][126][0].apply(exports, arguments)
    }, {
        "./utils": 137,
        dup: 126
    }],
    136: [function(require, module, exports) {
        arguments[4][127][0].apply(exports, arguments)
    }, {
        buffer: 170,
        dup: 127
    }],
    137: [function(require, module, exports) {
        arguments[4][128][0].apply(exports, arguments)
    }, {
        buffer: 170,
        dup: 128
    }],
    138: [function(require, module, exports) {
        arguments[4][107][0].apply(exports, arguments)
    }, {
        dup: 107
    }],
    139: [function(require, module, exports) {
        arguments[4][105][0].apply(exports, arguments)
    }, {
        dup: 105
    }],
    140: [function(require, module) {
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-collection-underscore-mixin"] = window.ampersand["ampersand-collection-underscore-mixin"] || [], window.ampersand["ampersand-collection-underscore-mixin"].push("1.0.3"));
        var _ = require("underscore"),
            slice = [].slice,
            mixins = {},
            methods = ["forEach", "each", "map", "collect", "reduce", "foldl", "inject", "reduceRight", "foldr", "find", "detect", "filter", "select", "reject", "every", "all", "some", "any", "include", "contains", "invoke", "max", "min", "toArray", "size", "first", "head", "take", "initial", "rest", "tail", "drop", "last", "without", "difference", "indexOf", "shuffle", "lastIndexOf", "isEmpty", "chain", "sample", "partition"];
        _.each(methods, function(method) {
            _[method] && (mixins[method] = function() {
                var args = slice.call(arguments);
                return args.unshift(this.models), _[method].apply(_, args)
            })
        });
        var attributeMethods = ["groupBy", "countBy", "sortBy", "indexBy"];
        _.each(attributeMethods, function(method) {
            _[method] && (mixins[method] = function(value, context) {
                var iterator = _.isFunction(value) ? value : function(model) {
                    return model.get ? model.get(value) : model[value]
                };
                return _[method](this.models, iterator, context)
            })
        }), mixins.where = function(attrs, first) {
            return _.isEmpty(attrs) ? first ? void 0 : [] : this[first ? "find" : "filter"](function(model) {
                var value;
                for (var key in attrs)
                    if (value = model.get ? model.get(key) : model[key], attrs[key] !== value) return !1;
                return !0
            })
        }, mixins.findWhere = function(attrs) {
            return this.where(attrs, !0)
        }, mixins.pluck = function(attr) {
            return _.invoke(this.models, "get", attr)
        }, module.exports = mixins
    }, {
        underscore: 189
    }],
    141: [function(require, module) {
        var Events = require("backbone-events-standalone"),
            extend = require("amp-extend"),
            bind = require("amp-bind"),
            History = function() {
                this.handlers = [], this.checkUrl = bind(this.checkUrl, this), "undefined" != typeof window && (this.location = window.location, this.history = window.history)
            },
            routeStripper = /^[#\/]|\s+$/g,
            rootStripper = /^\/+|\/+$/g,
            pathStripper = /#.*$/;
        History.started = !1, extend(History.prototype, Events, {
            interval: 50,
            atRoot: function() {
                var path = this.location.pathname.replace(/[^\/]$/, "$&/");
                return path === this.root && !this.location.search
            },
            getHash: function(window) {
                var match = (window || this).location.href.match(/#(.*)$/);
                return match ? match[1] : ""
            },
            getPath: function() {
                var path = decodeURI(this.location.pathname + this.location.search),
                    root = this.root.slice(0, -1);
                return path.indexOf(root) || (path = path.slice(root.length)), path.slice(1)
            },
            getFragment: function(fragment) {
                return null == fragment && (fragment = this._hasPushState || !this._wantsHashChange ? this.getPath() : this.getHash()), fragment.replace(routeStripper, "")
            },
            start: function(options) {
                if (History.started) throw new Error("Backbone.history has already been started");
                History.started = !0, this.options = extend({
                    root: "/"
                }, this.options, options), this.root = this.options.root, this._wantsHashChange = this.options.hashChange !== !1, this._hasHashChange = "onhashchange" in window, this._wantsPushState = !!this.options.pushState, this._hasPushState = !!(this.options.pushState && this.history && this.history.pushState), this.fragment = this.getFragment();
                var addEventListener = window.addEventListener;
                if (this.root = ("/" + this.root + "/").replace(rootStripper, "/"), this._hasPushState ? addEventListener("popstate", this.checkUrl, !1) : this._wantsHashChange && this._hasHashChange ? addEventListener("hashchange", this.checkUrl, !1) : this._wantsHashChange && (this._checkUrlInterval = setInterval(this.checkUrl, this.interval)), this._wantsHashChange && this._wantsPushState) {
                    if (!this._hasPushState && !this.atRoot()) return this.location.replace(this.root + "#" + this.getPath()), !0;
                    this._hasPushState && this.atRoot() && this.navigate(this.getHash(), {
                        replace: !0
                    })
                }
                return this.options.silent ? void 0 : this.loadUrl()
            },
            stop: function() {
                var removeEventListener = window.removeEventListener;
                this._hasPushState ? removeEventListener("popstate", this.checkUrl, !1) : this._wantsHashChange && this._hasHashChange && removeEventListener("hashchange", this.checkUrl, !1), this._checkUrlInterval && clearInterval(this._checkUrlInterval), History.started = !1
            },
            route: function(route, callback) {
                this.handlers.unshift({
                    route: route,
                    callback: callback
                })
            },
            checkUrl: function() {
                var current = this.getFragment();
                return current === this.fragment ? !1 : void this.loadUrl()
            },
            loadUrl: function(fragment) {
                return fragment = this.fragment = this.getFragment(fragment), this.handlers.some(function(handler) {
                    return handler.route.test(fragment) ? (handler.callback(fragment), !0) : void 0
                })
            },
            navigate: function(fragment, options) {
                if (!History.started) return !1;
                options && options !== !0 || (options = {
                    trigger: !!options
                });
                var url = this.root + (fragment = this.getFragment(fragment || ""));
                if (fragment = decodeURI(fragment.replace(pathStripper, "")), this.fragment !== fragment) {
                    if (this.fragment = fragment, "" === fragment && "/" !== url && (url = url.slice(0, -1)), this._hasPushState) this.history[options.replace ? "replaceState" : "pushState"]({}, document.title, url);
                    else {
                        if (!this._wantsHashChange) return this.location.assign(url);
                        this._updateHash(this.location, fragment, options.replace)
                    }
                    return options.trigger ? this.loadUrl(fragment) : void 0
                }
            },
            _updateHash: function(location, fragment, replace) {
                if (replace) {
                    var href = location.href.replace(/(javascript:|#).*$/, "");
                    location.replace(href + "#" + fragment)
                } else location.hash = "#" + fragment
            }
        }), module.exports = new History
    }, {
        "amp-bind": 143,
        "amp-extend": 145,
        "backbone-events-standalone": 151
    }],
    142: [function(require, module) {
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-router"] = window.ampersand["ampersand-router"] || [], window.ampersand["ampersand-router"].push("1.0.7"));
        var classExtend = require("ampersand-class-extend"),
            Events = require("backbone-events-standalone"),
            ampHistory = require("./ampersand-history"),
            extend = require("amp-extend"),
            isRegexp = require("amp-is-regexp"),
            isFunction = require("amp-is-function"),
            result = require("amp-result"),
            Router = module.exports = function(options) {
                options || (options = {}), this.history = options.history || ampHistory, options.routes && (this.routes = options.routes), this._bindRoutes(), this.initialize.apply(this, arguments)
            },
            optionalParam = /\((.*?)\)/g,
            namedParam = /(\(\?)?:\w+/g,
            splatParam = /\*\w+/g,
            escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
        extend(Router.prototype, Events, {
            initialize: function() {},
            route: function(route, name, callback) {
                isRegexp(route) || (route = this._routeToRegExp(route)), isFunction(name) && (callback = name, name = ""), callback || (callback = this[name]);
                var router = this;
                return this.history.route(route, function(fragment) {
                    var args = router._extractParameters(route, fragment);
                    router.execute(callback, args, name) !== !1 && (router.trigger.apply(router, ["route:" + name].concat(args)), router.trigger("route", name, args), router.history.trigger("route", router, name, args))
                }), this
            },
            execute: function(callback, args) {
                callback && callback.apply(this, args)
            },
            navigate: function(fragment, options) {
                return this.history.navigate(fragment, options), this
            },
            redirectTo: function(newUrl) {
                this.navigate(newUrl, {
                    replace: !0,
                    trigger: !0
                })
            },
            _bindRoutes: function() {
                if (this.routes) {
                    this.routes = result(this, "routes");
                    for (var route, routes = Object.keys(this.routes); null != (route = routes.pop());) this.route(route, this.routes[route])
                }
            },
            _routeToRegExp: function(route) {
                return route = route.replace(escapeRegExp, "\\$&").replace(optionalParam, "(?:$1)?").replace(namedParam, function(match, optional) {
                    return optional ? match : "([^/?]+)"
                }).replace(splatParam, "([^?]*?)"), new RegExp("^" + route + "(?:\\?([\\s\\S]*))?$")
            },
            _extractParameters: function(route, fragment) {
                var params = route.exec(fragment).slice(1);
                return params.map(function(param, i) {
                    return i === params.length - 1 ? param || null : param ? decodeURIComponent(param) : null
                })
            }
        }), Router.extend = classExtend
    }, {
        "./ampersand-history": 141,
        "amp-extend": 145,
        "amp-is-function": 147,
        "amp-is-regexp": 148,
        "amp-result": 149,
        "ampersand-class-extend": 104,
        "backbone-events-standalone": 151
    }],
    143: [function(require, module, exports) {
        arguments[4][85][0].apply(exports, arguments)
    }, {
        "amp-is-function": 147,
        "amp-is-object": 144,
        dup: 85
    }],
    144: [function(require, module, exports) {
        arguments[4][62][0].apply(exports, arguments)
    }, {
        dup: 62
    }],
    145: [function(require, module, exports) {
        arguments[4][61][0].apply(exports, arguments)
    }, {
        "amp-is-object": 146,
        dup: 61
    }],
    146: [function(require, module, exports) {
        arguments[4][62][0].apply(exports, arguments)
    }, {
        dup: 62
    }],
    147: [function(require, module, exports) {
        arguments[4][67][0].apply(exports, arguments)
    }, {
        dup: 67
    }],
    148: [function(require, module) {
        var toString = Object.prototype.toString;
        module.exports = function(obj) {
            return "[object RegExp]" === toString.call(obj)
        }
    }, {}],
    149: [function(require, module) {
        var isFunction = require("amp-is-function");
        module.exports = function(object, property, defaultValue) {
            var value = null == object ? void 0 : object[property];
            return void 0 === value ? isFunction(defaultValue) ? defaultValue() : defaultValue : isFunction(value) ? object[property]() : value
        }
    }, {
        "amp-is-function": 147
    }],
    150: [function(require, module, exports) {
        arguments[4][112][0].apply(exports, arguments)
    }, {
        dup: 112
    }],
    151: [function(require, module, exports) {
        arguments[4][113][0].apply(exports, arguments)
    }, {
        "./backbone-events-standalone": 150,
        dup: 113
    }],
    152: [function(require, module) {
        function SubCollection(collection, spec) {
            this.collection = collection, this.models = [], this.configure(spec || {}, !0), this.listenTo(this.collection, "all", this._onCollectionEvent)
        }
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-subcollection"] = window.ampersand["ampersand-subcollection"] || [], window.ampersand["ampersand-subcollection"].push("2.0.1"));
        var _ = require("underscore"),
            Events = require("backbone-events-standalone"),
            classExtend = require("ampersand-class-extend"),
            underscoreMixins = require("ampersand-collection-underscore-mixin"),
            slice = Array.prototype.slice;

        _.extend(SubCollection.prototype, Events, underscoreMixins, {
            addFilter: function(filter) {
                this.swapFilters([filter], [])
            },
            removeFilter: function(filter) {
                this.swapFilters([], [filter])
            },
            clearFilters: function() {
                this._resetFilters(), this._runFilters()
            },
            swapFilters: function(newFilters, oldFilters) {
                var self = this;
                oldFilters ? _.isArray(oldFilters) || (oldFilters = [oldFilters]) : oldFilters = this._filters, newFilters ? _.isArray(newFilters) || (newFilters = [newFilters]) : newFilters = [], oldFilters.forEach(function(filter) {
                    self._removeFilter(filter)
                }), newFilters.forEach(function(filter) {
                    self._addFilter(filter)
                }), this._runFilters()
            },
            configure: function(opts, clear) {
                clear && this._resetFilters(clear), this._parseSpec(opts), this._runFilters()
            },
            at: function(index) {
                return this.models[index]
            },
            get: function(query, indexName) {
                var model = this.collection.get(query, indexName);
                return model && this.contains(model) ? model : void 0
            },
            _removeFilter: function(filter) {
                var index = this._filters.indexOf(filter); - 1 !== index && this._filters.splice(index, 1)
            },
            reset: function() {
                this.configure({}, !0)
            },
            _resetFilters: function(resetComparator) {
                this._filters = [], this._watched = [], this.limit = void 0, this.offset = void 0, resetComparator && (this.comparator = void 0)
            },
            _addFilter: function(filter) {
                this._filters.push(filter)
            },
            _watch: function(item) {
                this._watched = _.union(this._watched, _.isArray(item) ? item : [item])
            },
            _unwatch: function(item) {
                this._watched = _.difference(this._watched, _.isArray(item) ? item : [item])
            },
            _parseSpec: function(spec) {
                spec.watched && this._watch(spec.watched), spec.comparator && (this.comparator = spec.comparator), spec.where && (_.each(spec.where, function(value, item) {
                    this._addFilter(function(model) {
                        return (model.get ? model.get(item) : model[item]) === value
                    })
                }, this), this._watch(_.keys(spec.where))), spec.hasOwnProperty("limit") && (this.limit = spec.limit), spec.hasOwnProperty("offset") && (this.offset = spec.offset), spec.filter && this._addFilter(spec.filter), spec.filters && spec.filters.forEach(this._addFilter, this)
            },
            _runFilters: function() {
                var newModels, toAdd, toRemove, existingModels = slice.call(this.models),
                    rootModels = slice.call(this.collection.models),
                    offset = this.offset || 0;
                newModels = this._filters.length ? _.reduce(this._filters, function(startingArray, filterFunc) {
                    return startingArray.filter(filterFunc)
                }, rootModels) : slice.call(rootModels), this.comparator && (newModels = _.sortBy(newModels, this.comparator)), (this.limit || this.offset) && (this.filtered = newModels, newModels = newModels.slice(offset, this.limit + offset)), toAdd = _.difference(newModels, existingModels), toRemove = _.difference(existingModels, newModels), this.models = newModels, _.each(toRemove, function(model) {
                    this.trigger("remove", model, this)
                }, this), _.each(toAdd, function(model) {
                    this.trigger("add", model, this)
                }, this), _.isEqual(existingModels, newModels) || this.trigger("sort", this)
            },
            _onCollectionEvent: function(eventName, model) {
                var propName = eventName.split(":")[1];
                (propName === this.comparator || _.contains(this._watched, propName) || _.contains(["add", "remove", "reset", "sync"], eventName)) && this._runFilters(), !_.contains(["add", "remove"], eventName) && this.contains(model) && this.trigger.apply(this, arguments)
            }
        }), Object.defineProperty(SubCollection.prototype, "length", {
            get: function() {
                return this.models.length
            }
        }), Object.defineProperty(SubCollection.prototype, "isCollection", {
            get: function() {
                return !0
            }
        }), SubCollection.extend = classExtend, module.exports = SubCollection
    }, {
        "ampersand-class-extend": 104,
        "ampersand-collection-underscore-mixin": 153,
        "backbone-events-standalone": 155,
        underscore: 189
    }],
    153: [function(require, module, exports) {
        arguments[4][140][0].apply(exports, arguments)
    }, {
        dup: 140,
        underscore: 189
    }],
    154: [function(require, module, exports) {
        arguments[4][112][0].apply(exports, arguments)
    }, {
        dup: 112
    }],
    155: [function(require, module, exports) {
        arguments[4][113][0].apply(exports, arguments)
    }, {
        "./backbone-events-standalone": 154,
        dup: 113
    }],
    156: [function(require, module) {
        function ViewSwitcher(el, options) {
            options || (options = {}), this.el = el, this.config = {
                hide: null,
                show: null,
                empty: null,
                waitForRemove: !1
            };
            for (var item in options) this.config.hasOwnProperty(item) && (this.config[item] = options[item]);
            options.view ? (this._setCurrent(options.view), this._render(options.view)) : this._onViewRemove()
        }
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-view-switcher"] = window.ampersand["ampersand-view-switcher"] || [], window.ampersand["ampersand-view-switcher"].push("2.0.0")), ViewSwitcher.prototype.set = function(view) {
            var self = this,
                prev = this.previous = this.current;
            prev !== view && (this.config.waitForRemove ? this._hide(prev, function() {
                self._show(view)
            }) : (this._hide(prev), this._show(view)))
        }, ViewSwitcher.prototype._setCurrent = function(view) {
            this.current = view, view && this._registerRemoveListener(view);
            var emptyCb = this.config.empty;
            return emptyCb && !this.current && emptyCb(), view
        }, ViewSwitcher.prototype.clear = function(cb) {
            this._hide(this.current, cb)
        }, ViewSwitcher.prototype.remove = function() {
            this.current && this.current.remove()
        }, ViewSwitcher.prototype._show = function(view) {
            var customShow = this.config.show;
            this._setCurrent(view), this._render(view), customShow && customShow(view)
        }, ViewSwitcher.prototype._registerRemoveListener = function(view) {
            view && view.once("remove", this._onViewRemove, this)
        }, ViewSwitcher.prototype._onViewRemove = function(view) {
            var emptyCb = this.config.empty;
            this.current === view && (this.current = null), emptyCb && !this.current && emptyCb()
        }, ViewSwitcher.prototype._render = function(view) {
            view.rendered || view.render({
                containerEl: this.el
            }), view.insertSelf || this.el.appendChild(view.el)
        }, ViewSwitcher.prototype._hide = function(view, cb) {
            var customHide = this.config.hide;
            return view ? void(customHide ? 2 === customHide.length ? customHide(view, function() {
                view.remove(), cb && cb()
            }) : (customHide(view), view.remove(), cb && cb()) : (view.remove(), cb && cb())) : cb && cb()
        }, module.exports = ViewSwitcher
    }, {}],
    157: [function(require, module) {
        function View(attrs) {
            this.cid = _.uniqueId("view"), attrs || (attrs = {});
            var parent = attrs.parent;
            delete attrs.parent, BaseState.call(this, attrs, {
                init: !1,
                parent: parent
            }), this.on("change:el", this._handleElementChange, this), this._parsedBindings = bindings(this.bindings, this), this._initializeBindings(), attrs.el && !this.autoRender && this._handleElementChange(), this._initializeSubviews(), this.template = attrs.template || this.template, this.initialize.apply(this, arguments), this.set(_.pick(attrs, viewOptions)), this.autoRender && this.template && this.render()
        }
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-view"] = window.ampersand["ampersand-view"] || [], window.ampersand["ampersand-view"].push("7.2.0"));
        var State = require("ampersand-state"),
            CollectionView = require("ampersand-collection-view"),
            domify = require("domify"),
            _ = require("underscore"),
            events = require("events-mixin"),
            matches = require("matches-selector"),
            bindings = require("ampersand-dom-bindings"),
            getPath = require("get-object-path"),
            BaseState = State.extend({
                dataTypes: {
                    element: {
                        set: function(newVal) {
                            return {
                                val: newVal,
                                type: newVal instanceof Element ? "element" : typeof newVal
                            }
                        },
                        compare: function(el1, el2) {
                            return el1 === el2
                        }
                    },
                    collection: {
                        set: function(newVal) {
                            return {
                                val: newVal,
                                type: newVal && newVal.isCollection ? "collection" : typeof newVal
                            }
                        },
                        compare: function(currentVal, newVal) {
                            return currentVal === newVal
                        }
                    }
                },
                props: {
                    model: "state",
                    el: "element",
                    collection: "collection"
                },
                derived: {
                    rendered: {
                        deps: ["el"],
                        fn: function() {
                            return !!this.el
                        }
                    },
                    hasData: {
                        deps: ["model"],
                        fn: function() {
                            return !!this.model
                        }
                    }
                }
            }),
            viewOptions = ["model", "collection", "el"];
        View.prototype = Object.create(BaseState.prototype), _.extend(View.prototype, {
            query: function(selector) {
                return selector ? "string" == typeof selector ? matches(this.el, selector) ? this.el : this.el.querySelector(selector) || void 0 : selector : this.el
            },
            queryAll: function(selector) {
                var res = [];
                return this.el ? "" === selector ? [this.el] : (matches(this.el, selector) && res.push(this.el), res.concat(Array.prototype.slice.call(this.el.querySelectorAll(selector)))) : res
            },
            queryByHook: function(hook) {
                return this.query('[data-hook~="' + hook + '"]')
            },
            initialize: function() {},
            render: function() {
                return this.renderWithTemplate(this), this
            },
            remove: function() {
                var parsedBindings = this._parsedBindings;
                return this.el && this.el.parentNode && this.el.parentNode.removeChild(this.el), this._subviews && _.chain(this._subviews).flatten().invoke("remove"), this.stopListening(), _.each(parsedBindings, function(properties, modelName) {
                    _.each(properties, function(value, key) {
                        delete parsedBindings[modelName][key]
                    }), delete parsedBindings[modelName]
                }), this.trigger("remove", this), this
            },
            _handleElementChange: function() {
                return this.eventManager && this.eventManager.unbind(), this.eventManager = events(this.el, this), this.delegateEvents(), this._applyBindingsForKey(), this
            },
            delegateEvents: function(events) {
                if (!events && !(events = _.result(this, "events"))) return this;
                this.undelegateEvents();
                for (var key in events) this.eventManager.bind(key, events[key]);
                return this
            },
            undelegateEvents: function() {
                return this.eventManager.unbind(), this
            },
            registerSubview: function(view) {
                return this._subviews || (this._subviews = []), this._subviews.push(view), view.el && (view.parent = this), view
            },
            renderSubview: function(view, container) {
                return "string" == typeof container && (container = this.query(container)), this.registerSubview(view), view.render(), (container || this.el).appendChild(view.el), view
            },
            _applyBindingsForKey: function(name) {
                if (this.el) {
                    var item, fns = this._parsedBindings.getGrouped(name);
                    for (item in fns) fns[item].forEach(function(fn) {
                        fn(this.el, getPath(this, item), _.last(item.split(".")))
                    }, this)
                }
            },
            _initializeBindings: function() {
                this.bindings && this.on("all", function(eventName) {
                    "change:" === eventName.slice(0, 7) && this._applyBindingsForKey(eventName.split(":")[1])
                }, this)
            },
            _initializeSubviews: function() {
                if (this.subviews)
                    for (var item in this.subviews) this._parseSubview(this.subviews[item], item)
            },
            _parseSubview: function(subview, name) {
                function action() {
                    var el, subview;
                    this.el && (el = this.query(opts.selector)) && (!opts.waitFor || getPath(this, opts.waitFor)) && (subview = this[name] = opts.prepareView.call(this, el), subview.render(), this.registerSubview(subview), this.off("change", action))
                }
                var self = this,
                    opts = {
                        selector: subview.container || '[data-hook="' + subview.hook + '"]',
                        waitFor: subview.waitFor || "",
                        prepareView: subview.prepareView || function(el) {
                            return new subview.constructor({
                                el: el,
                                parent: self
                            })
                        }
                    };
                this.on("change", action, this)
            },
            renderWithTemplate: function(context, templateArg) {
                var template = templateArg || this.template;
                if (!template) throw new Error("Template string or function needed.");
                var newDom = _.isString(template) ? template : template.call(this, context || this);
                _.isString(newDom) && (newDom = domify(newDom));
                var parent = this.el && this.el.parentNode;
                if (parent && parent.replaceChild(newDom, this.el), "#document-fragment" === newDom.nodeName) throw new Error("Views can only have one root element.");
                return this.el = newDom, this
            },
            cacheElements: function(hash) {
                for (var item in hash) this[item] = this.query(hash[item])
            },
            listenToAndRun: function(object, events, handler) {
                var bound = _.bind(handler, this);
                this.listenTo(object, events, bound), bound()
            },
            animateRemove: function() {
                this.remove()
            },
            renderCollection: function(collection, ViewClass, container, opts) {
                var containerEl = "string" == typeof container ? this.query(container) : container,
                    config = _.extend({
                        collection: collection,
                        el: containerEl || this.el,
                        view: ViewClass,
                        parent: this,
                        viewOptions: {
                            parent: this
                        }
                    }, opts),
                    collectionView = new CollectionView(config);
                return collectionView.render(), this.registerSubview(collectionView)
            }
        }), View.extend = BaseState.extend, module.exports = View
    }, {
        "ampersand-collection-view": 106,
        "ampersand-dom-bindings": 158,
        "ampersand-state": 160,
        domify: 174,
        "events-mixin": 176,
        "get-object-path": 165,
        "matches-selector": 166,
        underscore: 167
    }],
    158: [function(require, module) {
        function getMatches(el, selector) {
            if ("" === selector) return [el];
            var matches = [];
            return matchesSelector(el, selector) && matches.push(el), matches.concat(slice.call(el.querySelectorAll(selector)))
        }

        function makeArray(val) {
            return Array.isArray(val) ? val : [val]
        }

        function getBindingFunc(binding, context) {
            var previousValue, type = binding.type || "text",
                isCustomBinding = "function" == typeof type,
                selector = function() {
                    return "string" == typeof binding.selector ? binding.selector : binding.hook ? '[data-hook~="' + binding.hook + '"]' : ""
                }(),
                yes = binding.yes,
                no = binding.no,
                hasYesNo = !(!yes && !no);
            if (isCustomBinding) return function(el, value) {
                getMatches(el, selector).forEach(function(match) {
                    type.call(context, match, value, previousValue)
                }), previousValue = value
            };
            if ("text" === type) return function(el, value) {
                getMatches(el, selector).forEach(function(match) {
                    dom.text(match, value)
                })
            };
            if ("class" === type) return function(el, value) {
                getMatches(el, selector).forEach(function(match) {
                    dom.switchClass(match, previousValue, value)
                }), previousValue = value
            };
            if ("attribute" === type) {
                if (!binding.name) throw Error('attribute bindings must have a "name"');
                return function(el, value) {
                    var names = makeArray(binding.name);
                    getMatches(el, selector).forEach(function(match) {
                        names.forEach(function(name) {
                            dom.setAttribute(match, name, value)
                        })
                    }), previousValue = value
                }
            }
            if ("value" === type) return function(el, value) {
                getMatches(el, selector).forEach(function(match) {
                    value || 0 === value || (value = ""), document.activeElement !== match && (match.value = value)
                }), previousValue = value
            };
            if ("booleanClass" === type) return hasYesNo ? (yes = makeArray(yes || ""), no = makeArray(no || ""), function(el, value) {
                var prevClass = value ? no : yes,
                    newClass = value ? yes : no;
                getMatches(el, selector).forEach(function(match) {
                    prevClass.forEach(function(pc) {
                        dom.removeClass(match, pc)
                    }), newClass.forEach(function(nc) {
                        dom.addClass(match, nc)
                    })
                })
            }) : function(el, value, keyName) {
                var name = makeArray(binding.name || keyName);
                getMatches(el, selector).forEach(function(match) {
                    name.forEach(function(className) {
                        dom[value ? "addClass" : "removeClass"](match, className)
                    })
                })
            };
            if ("booleanAttribute" === type) return function(el, value, keyName) {
                var name = makeArray(binding.name || keyName);
                getMatches(el, selector).forEach(function(match) {
                    name.forEach(function(attr) {
                        dom[value ? "addAttribute" : "removeAttribute"](match, attr)
                    })
                })
            };
            if ("toggle" === type) return hasYesNo ? function(el, value) {
                getMatches(el, yes).forEach(function(match) {
                    dom[value ? "show" : "hide"](match)
                }), getMatches(el, no).forEach(function(match) {
                    dom[value ? "hide" : "show"](match)
                })
            } : function(el, value) {
                getMatches(el, selector).forEach(function(match) {
                    dom[value ? "show" : "hide"](match)
                })
            };
            if ("switch" === type) {
                if (!binding.cases) throw Error('switch bindings must have "cases"');
                return function(el, value) {
                    for (var item in binding.cases) getMatches(el, binding.cases[item]).forEach(function(match) {
                        dom[value === item ? "show" : "hide"](match)
                    })
                }
            }
            if ("innerHTML" === type) return function(el, value) {
                getMatches(el, selector).forEach(function(match) {
                    dom.html(match, value)
                })
            };
            if ("switchClass" === type) {
                if (!binding.cases) throw Error('switchClass bindings must have "cases"');
                return function(el, value, keyName) {
                    var name = makeArray(binding.name || keyName);
                    for (var item in binding.cases) getMatches(el, binding.cases[item]).forEach(function(match) {
                        name.forEach(function(className) {
                            dom[value === item ? "addClass" : "removeClass"](match, className)
                        })
                    })
                }
            }
            throw new Error("no such binding type: " + type)
        }
        "undefined" != typeof window && (window.ampersand = window.ampersand || {}, window.ampersand["ampersand-dom-bindings"] = window.ampersand["ampersand-dom-bindings"] || [], window.ampersand["ampersand-dom-bindings"].push("3.3.3"));
        var Store = require("key-tree-store"),
            dom = require("ampersand-dom"),
            matchesSelector = require("matches-selector");
        module.exports = function(bindings, context) {
            var key, current, store = new Store;
            for (key in bindings) current = bindings[key], "string" == typeof current ? store.add(key, getBindingFunc({
                type: "text",
                selector: current
            })) : current.forEach ? current.forEach(function(binding) {
                store.add(key, getBindingFunc(binding, context))
            }) : store.add(key, getBindingFunc(current, context));
            return store
        };
        var slice = Array.prototype.slice
    }, {
        "ampersand-dom": 116,
        "key-tree-store": 159,
        "matches-selector": 166
    }],
    159: [function(require, module) {
        function KeyTreeStore() {
            this.storage = {}
        }
        var slice = Array.prototype.slice;
        KeyTreeStore.prototype.add = function(keypath, obj) {
            var arr = this.storage[keypath] || (this.storage[keypath] = []);
            arr.push(obj)
        }, KeyTreeStore.prototype.remove = function(obj) {
            var path, arr;
            for (path in this.storage) arr = this.storage[path], arr.some(function(item, index) {
                return item === obj ? (arr.splice(index, 1), !0) : void 0
            })
        }, KeyTreeStore.prototype.get = function(keypath) {
            var key, res = [];
            for (key in this.storage) keypath && keypath !== key && 0 !== key.indexOf(keypath + ".") || (res = res.concat(this.storage[key]));
            return res
        }, KeyTreeStore.prototype.getGrouped = function(keypath) {
            var key, res = {};
            for (key in this.storage) keypath && keypath !== key && 0 !== key.indexOf(keypath + ".") || (res[key] = slice.call(this.storage[key]));
            return res
        }, KeyTreeStore.prototype.getAll = function(keypath) {
            var key, res = {};
            for (key in this.storage)(keypath === key || 0 === key.indexOf(keypath + ".")) && (res[key] = slice.call(this.storage[key]));
            return res
        }, KeyTreeStore.prototype.run = function(keypath, context) {
            var args = slice.call(arguments, 2);
            this.get(keypath).forEach(function(fn) {
                fn.apply(context || this, args)
            })
        }, module.exports = KeyTreeStore
    }, {}],
    160: [function(require, module, exports) {
        arguments[4][118][0].apply(exports, arguments)
    }, {
        "array-next": 161,
        "backbone-events-standalone": 163,
        dup: 118,
        "key-tree-store": 164,
        underscore: 167
    }],
    161: [function(require, module, exports) {
        arguments[4][119][0].apply(exports, arguments)
    }, {
        dup: 119
    }],
    162: [function(require, module, exports) {
        arguments[4][112][0].apply(exports, arguments)
    }, {
        dup: 112
    }],
    163: [function(require, module, exports) {
        arguments[4][113][0].apply(exports, arguments)
    }, {
        "./backbone-events-standalone": 162,
        dup: 113
    }],
    164: [function(require, module, exports) {
        arguments[4][122][0].apply(exports, arguments)
    }, {
        dup: 122
    }],
    165: [function(require, module) {
        function get(context, path) {
            if (-1 == path.indexOf(".") && -1 == path.indexOf("[")) return context[path];
            for (var result, crumbs = path.split(/\.|\[|\]/g), i = -1, len = crumbs.length; ++i < len;)
                if (0 == i && (result = context), crumbs[i]) {
                    if (void 0 == result) break;
                    result = result[crumbs[i]]
                }
            return result
        }
        module.exports = get
    }, {}],
    166: [function(require, module) {
        "use strict";

        function match(el, selector) {
            if (vendor) return vendor.call(el, selector);
            for (var nodes = el.parentNode.querySelectorAll(selector), i = 0; i < nodes.length; i++)
                if (nodes[i] == el) return !0;
            return !1
        }
        var proto = Element.prototype,
            vendor = proto.matches || proto.matchesSelector || proto.webkitMatchesSelector || proto.mozMatchesSelector || proto.msMatchesSelector || proto.oMatchesSelector;
        module.exports = match
    }, {}],
    167: [function(require, module, exports) {
        arguments[4][107][0].apply(exports, arguments)
    }, {
        dup: 107
    }],
    168: [function(require, module, exports) {
        ! function() {
            function miniscore() {
                return {
                    keys: Object.keys || function(obj) {
                        if ("object" != typeof obj && "function" != typeof obj || null === obj) throw new TypeError("keys() called on a non-object");
                        var key, keys = [];
                        for (key in obj) obj.hasOwnProperty(key) && (keys[keys.length] = key);
                        return keys
                    },
                    uniqueId: function(prefix) {
                        var id = ++idCounter + "";
                        return prefix ? prefix + id : id
                    },
                    has: function(obj, key) {
                        return hasOwnProperty.call(obj, key)
                    },
                    each: function(obj, iterator, context) {
                        if (null != obj)
                            if (nativeForEach && obj.forEach === nativeForEach) obj.forEach(iterator, context);
                            else if (obj.length === +obj.length) {
                            for (var i = 0, l = obj.length; l > i; i++)
                                if (iterator.call(context, obj[i], i, obj) === breaker) return
                        } else
                            for (var key in obj)
                                if (this.has(obj, key) && iterator.call(context, obj[key], key, obj) === breaker) return
                    },
                    once: function(func) {
                        var memo, ran = !1;
                        return function() {
                            return ran ? memo : (ran = !0, memo = func.apply(this, arguments), func = null, memo)
                        }
                    }
                }
            }
            var Events, root = this,
                breaker = {},
                nativeForEach = Array.prototype.forEach,
                hasOwnProperty = Object.prototype.hasOwnProperty,
                slice = Array.prototype.slice,
                idCounter = 0,
                _ = miniscore();
            Events = {
                on: function(name, callback, context) {
                    if (!eventsApi(this, "on", name, [callback, context]) || !callback) return this;
                    this._events || (this._events = {});
                    var events = this._events[name] || (this._events[name] = []);
                    return events.push({
                        callback: callback,
                        context: context,
                        ctx: context || this
                    }), this
                },
                once: function(name, callback, context) {
                    if (!eventsApi(this, "once", name, [callback, context]) || !callback) return this;
                    var self = this,
                        once = _.once(function() {
                            self.off(name, once), callback.apply(this, arguments)
                        });
                    return once._callback = callback, this.on(name, once, context)
                },
                off: function(name, callback, context) {
                    var retain, ev, events, names, i, l, j, k;
                    if (!this._events || !eventsApi(this, "off", name, [callback, context])) return this;
                    if (!name && !callback && !context) return this._events = {}, this;
                    for (names = name ? [name] : _.keys(this._events), i = 0, l = names.length; l > i; i++)
                        if (name = names[i], events = this._events[name]) {
                            if (this._events[name] = retain = [], callback || context)
                                for (j = 0, k = events.length; k > j; j++) ev = events[j], (callback && callback !== ev.callback && callback !== ev.callback._callback || context && context !== ev.context) && retain.push(ev);
                            retain.length || delete this._events[name]
                        }
                    return this
                },
                trigger: function(name) {
                    if (!this._events) return this;
                    var args = slice.call(arguments, 1);
                    if (!eventsApi(this, "trigger", name, args)) return this;
                    var events = this._events[name],
                        allEvents = this._events.all;
                    return events && triggerEvents(events, args), allEvents && triggerEvents(allEvents, arguments), this
                },
                stopListening: function(obj, name, callback) {
                    var listeners = this._listeners;
                    if (!listeners) return this;
                    var deleteListener = !name && !callback;
                    "object" == typeof name && (callback = this), obj && ((listeners = {})[obj._listenerId] = obj);
                    for (var id in listeners) listeners[id].off(name, callback, this), deleteListener && delete this._listeners[id];
                    return this
                }
            };
            var eventSplitter = /\s+/,
                eventsApi = function(obj, action, name, rest) {
                    if (!name) return !0;
                    if ("object" == typeof name) {
                        for (var key in name) obj[action].apply(obj, [key, name[key]].concat(rest));
                        return !1
                    }
                    if (eventSplitter.test(name)) {
                        for (var names = name.split(eventSplitter), i = 0, l = names.length; l > i; i++) obj[action].apply(obj, [names[i]].concat(rest));
                        return !1
                    }
                    return !0
                },
                triggerEvents = function(events, args) {
                    var ev, i = -1,
                        l = events.length,
                        a1 = args[0],
                        a2 = args[1],
                        a3 = args[2];
                    switch (args.length) {
                        case 0:
                            for (; ++i < l;)(ev = events[i]).callback.call(ev.ctx);
                            return;
                        case 1:
                            for (; ++i < l;)(ev = events[i]).callback.call(ev.ctx, a1);
                            return;
                        case 2:
                            for (; ++i < l;)(ev = events[i]).callback.call(ev.ctx, a1, a2);
                            return;
                        case 3:
                            for (; ++i < l;)(ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
                            return;
                        default:
                            for (; ++i < l;)(ev = events[i]).callback.apply(ev.ctx, args)
                    }
                },
                listenMethods = {
                    listenTo: "on",
                    listenToOnce: "once"
                };
            _.each(listenMethods, function(implementation, method) {
                Events[method] = function(obj, name, callback) {
                    var listeners = this._listeners || (this._listeners = {}),
                        id = obj._listenerId || (obj._listenerId = _.uniqueId("l"));
                    return listeners[id] = obj, "object" == typeof name && (callback = this), obj[implementation](name, callback, this), this
                }
            }), Events.bind = Events.on, Events.unbind = Events.off, Events.mixin = function(proto) {
                var exports = ["on", "once", "off", "trigger", "stopListening", "listenTo", "listenToOnce", "bind", "unbind"];
                return _.each(exports, function(name) {
                    proto[name] = this[name]
                }, this), proto
            }, "function" == typeof define ? define(function() {
                return Events
            }) : "undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = Events), exports.BackboneEvents = Events) : root.BackboneEvents = Events
        }(this)
    }, {}],
    169: [function(require, module, exports) {
        arguments[4][113][0].apply(exports, arguments)
    }, {
        "./backbone-events-standalone": 168,
        dup: 113
    }],
    170: [function(require, module, exports) {
        function Buffer(subject, encoding) {
            var self = this;
            if (!(self instanceof Buffer)) return new Buffer(subject, encoding);
            var length, type = typeof subject;
            if ("number" === type) length = +subject;
            else if ("string" === type) length = Buffer.byteLength(subject, encoding);
            else {
                if ("object" !== type || null === subject) throw new TypeError("must start with number, buffer, array or string");
                "Buffer" === subject.type && isArray(subject.data) && (subject = subject.data), length = +subject.length
            }
            if (length > kMaxLength) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength.toString(16) + " bytes");
            0 > length ? length = 0 : length >>>= 0, Buffer.TYPED_ARRAY_SUPPORT ? self = Buffer._augment(new Uint8Array(length)) : (self.length = length, self._isBuffer = !0);
            var i;
            if (Buffer.TYPED_ARRAY_SUPPORT && "number" == typeof subject.byteLength) self._set(subject);
            else if (isArrayish(subject))
                if (Buffer.isBuffer(subject))
                    for (i = 0; length > i; i++) self[i] = subject.readUInt8(i);
                else
                    for (i = 0; length > i; i++) self[i] = (subject[i] % 256 + 256) % 256;
            else if ("string" === type) self.write(subject, 0, encoding);
            else if ("number" === type && !Buffer.TYPED_ARRAY_SUPPORT)
                for (i = 0; length > i; i++) self[i] = 0;
            return length > 0 && length <= Buffer.poolSize && (self.parent = rootParent), self
        }

        function SlowBuffer(subject, encoding) {
            if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding);
            var buf = new Buffer(subject, encoding);
            return delete buf.parent, buf
        }

        function hexWrite(buf, string, offset, length) {
            offset = Number(offset) || 0;
            var remaining = buf.length - offset;
            length ? (length = Number(length), length > remaining && (length = remaining)) : length = remaining;
            var strLen = string.length;
            if (strLen % 2 !== 0) throw new Error("Invalid hex string");
            length > strLen / 2 && (length = strLen / 2);
            for (var i = 0; length > i; i++) {
                var parsed = parseInt(string.substr(2 * i, 2), 16);
                if (isNaN(parsed)) throw new Error("Invalid hex string");
                buf[offset + i] = parsed
            }
            return i
        }

        function utf8Write(buf, string, offset, length) {
            var charsWritten = blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
            return charsWritten
        }

        function asciiWrite(buf, string, offset, length) {
            var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length);
            return charsWritten
        }

        function binaryWrite(buf, string, offset, length) {
            return asciiWrite(buf, string, offset, length)
        }

        function base64Write(buf, string, offset, length) {
            var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length);
            return charsWritten
        }

        function utf16leWrite(buf, string, offset, length) {
            var charsWritten = blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
            return charsWritten
        }

        function base64Slice(buf, start, end) {
            return base64.fromByteArray(0 === start && end === buf.length ? buf : buf.slice(start, end))
        }

        function utf8Slice(buf, start, end) {
            var res = "",
                tmp = "";
            end = Math.min(buf.length, end);
            for (var i = start; end > i; i++) buf[i] <= 127 ? (res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i]), tmp = "") : tmp += "%" + buf[i].toString(16);
            return res + decodeUtf8Char(tmp)
        }

        function asciiSlice(buf, start, end) {
            var ret = "";
            end = Math.min(buf.length, end);
            for (var i = start; end > i; i++) ret += String.fromCharCode(127 & buf[i]);
            return ret
        }

        function binarySlice(buf, start, end) {
            var ret = "";
            end = Math.min(buf.length, end);
            for (var i = start; end > i; i++) ret += String.fromCharCode(buf[i]);
            return ret
        }

        function hexSlice(buf, start, end) {
            var len = buf.length;
            (!start || 0 > start) && (start = 0), (!end || 0 > end || end > len) && (end = len);
            for (var out = "", i = start; end > i; i++) out += toHex(buf[i]);
            return out
        }

        function utf16leSlice(buf, start, end) {
            for (var bytes = buf.slice(start, end), res = "", i = 0; i < bytes.length; i += 2) res += String.fromCharCode(bytes[i] + 256 * bytes[i + 1]);
            return res
        }

        function checkOffset(offset, ext, length) {
            if (offset % 1 !== 0 || 0 > offset) throw new RangeError("offset is not uint");
            if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length")
        }

        function checkInt(buf, value, offset, ext, max, min) {
            if (!Buffer.isBuffer(buf)) throw new TypeError("buffer must be a Buffer instance");
            if (value > max || min > value) throw new RangeError("value is out of bounds");
            if (offset + ext > buf.length) throw new RangeError("index out of range")
        }

        function objectWriteUInt16(buf, value, offset, littleEndian) {
            0 > value && (value = 65535 + value + 1);
            for (var i = 0, j = Math.min(buf.length - offset, 2); j > i; i++) buf[offset + i] = (value & 255 << 8 * (littleEndian ? i : 1 - i)) >>> 8 * (littleEndian ? i : 1 - i)
        }

        function objectWriteUInt32(buf, value, offset, littleEndian) {
            0 > value && (value = 4294967295 + value + 1);
            for (var i = 0, j = Math.min(buf.length - offset, 4); j > i; i++) buf[offset + i] = value >>> 8 * (littleEndian ? i : 3 - i) & 255
        }

        function checkIEEE754(buf, value, offset, ext, max, min) {
            if (value > max || min > value) throw new RangeError("value is out of bounds");
            if (offset + ext > buf.length) throw new RangeError("index out of range");
            if (0 > offset) throw new RangeError("index out of range")
        }

        function writeFloat(buf, value, offset, littleEndian, noAssert) {
            return noAssert || checkIEEE754(buf, value, offset, 4, 3.4028234663852886e38, -3.4028234663852886e38), ieee754.write(buf, value, offset, littleEndian, 23, 4), offset + 4
        }

        function writeDouble(buf, value, offset, littleEndian, noAssert) {
            return noAssert || checkIEEE754(buf, value, offset, 8, 1.7976931348623157e308, -1.7976931348623157e308), ieee754.write(buf, value, offset, littleEndian, 52, 8), offset + 8
        }

        function base64clean(str) {
            if (str = stringtrim(str).replace(INVALID_BASE64_RE, ""), str.length < 2) return "";
            for (; str.length % 4 !== 0;) str += "=";
            return str
        }

        function stringtrim(str) {
            return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, "")
        }

        function isArrayish(subject) {
            return isArray(subject) || Buffer.isBuffer(subject) || subject && "object" == typeof subject && "number" == typeof subject.length
        }

        function toHex(n) {
            return 16 > n ? "0" + n.toString(16) : n.toString(16)
        }

        function utf8ToBytes(string, units) {
            units = units || 1 / 0;
            for (var codePoint, length = string.length, leadSurrogate = null, bytes = [], i = 0; length > i; i++) {
                if (codePoint = string.charCodeAt(i), codePoint > 55295 && 57344 > codePoint) {
                    if (!leadSurrogate) {
                        if (codePoint > 56319) {
                            (units -= 3) > -1 && bytes.push(239, 191, 189);
                            continue
                        }
                        if (i + 1 === length) {
                            (units -= 3) > -1 && bytes.push(239, 191, 189);
                            continue
                        }
                        leadSurrogate = codePoint;
                        continue
                    }
                    if (56320 > codePoint) {
                        (units -= 3) > -1 && bytes.push(239, 191, 189), leadSurrogate = codePoint;
                        continue
                    }
                    codePoint = leadSurrogate - 55296 << 10 | codePoint - 56320 | 65536, leadSurrogate = null
                } else leadSurrogate && ((units -= 3) > -1 && bytes.push(239, 191, 189), leadSurrogate = null);
                if (128 > codePoint) {
                    if ((units -= 1) < 0) break;
                    bytes.push(codePoint)
                } else if (2048 > codePoint) {
                    if ((units -= 2) < 0) break;
                    bytes.push(codePoint >> 6 | 192, 63 & codePoint | 128)
                } else if (65536 > codePoint) {
                    if ((units -= 3) < 0) break;
                    bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, 63 & codePoint | 128)
                } else {
                    if (!(2097152 > codePoint)) throw new Error("Invalid code point");
                    if ((units -= 4) < 0) break;
                    bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, 63 & codePoint | 128)
                }
            }
            return bytes
        }

        function asciiToBytes(str) {
            for (var byteArray = [], i = 0; i < str.length; i++) byteArray.push(255 & str.charCodeAt(i));
            return byteArray
        }

        function utf16leToBytes(str, units) {
            for (var c, hi, lo, byteArray = [], i = 0; i < str.length && !((units -= 2) < 0); i++) c = str.charCodeAt(i), hi = c >> 8, lo = c % 256, byteArray.push(lo), byteArray.push(hi);
            return byteArray
        }

        function base64ToBytes(str) {
            return base64.toByteArray(base64clean(str))
        }

        function blitBuffer(src, dst, offset, length) {
            for (var i = 0; length > i && !(i + offset >= dst.length || i >= src.length); i++) dst[i + offset] = src[i];
            return i
        }

        function decodeUtf8Char(str) {
                try {
                    return decodeURIComponent(str)
                } catch (err) {
                    return String.fromCharCode(65533)
                }
            }
            /*!
             * The buffer module from node.js, for the browser.
             *
             * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
             * @license  MIT
             */
        var base64 = require("base64-js"),
            ieee754 = require("ieee754"),
            isArray = require("is-array");
        exports.Buffer = Buffer, exports.SlowBuffer = SlowBuffer, exports.INSPECT_MAX_BYTES = 50, Buffer.poolSize = 8192;
        var kMaxLength = 1073741823,
            rootParent = {};
        Buffer.TYPED_ARRAY_SUPPORT = function() {
            try {
                var buf = new ArrayBuffer(0),
                    arr = new Uint8Array(buf);
                return arr.foo = function() {
                    return 42
                }, 42 === arr.foo() && "function" == typeof arr.subarray && 0 === new Uint8Array(1).subarray(1, 1).byteLength
            } catch (e) {
                return !1
            }
        }(), Buffer.isBuffer = function(b) {
            return !(null == b || !b._isBuffer)
        }, Buffer.compare = function(a, b) {
            if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) throw new TypeError("Arguments must be Buffers");
            if (a === b) return 0;
            for (var x = a.length, y = b.length, i = 0, len = Math.min(x, y); len > i && a[i] === b[i]; i++);
            return i !== len && (x = a[i], y = b[i]), y > x ? -1 : x > y ? 1 : 0
        }, Buffer.isEncoding = function(encoding) {
            switch (String(encoding).toLowerCase()) {
                case "hex":
                case "utf8":
                case "utf-8":
                case "ascii":
                case "binary":
                case "base64":
                case "raw":
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    return !0;
                default:
                    return !1
            }
        }, Buffer.concat = function(list, totalLength) {
            if (!isArray(list)) throw new TypeError("list argument must be an Array of Buffers.");
            if (0 === list.length) return new Buffer(0);
            if (1 === list.length) return list[0];
            var i;
            if (void 0 === totalLength)
                for (totalLength = 0, i = 0; i < list.length; i++) totalLength += list[i].length;
            var buf = new Buffer(totalLength),
                pos = 0;
            for (i = 0; i < list.length; i++) {
                var item = list[i];
                item.copy(buf, pos), pos += item.length
            }
            return buf
        }, Buffer.byteLength = function(str, encoding) {
            var ret;
            switch (str += "", encoding || "utf8") {
                case "ascii":
                case "binary":
                case "raw":
                    ret = str.length;
                    break;
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    ret = 2 * str.length;
                    break;
                case "hex":
                    ret = str.length >>> 1;
                    break;
                case "utf8":
                case "utf-8":
                    ret = utf8ToBytes(str).length;
                    break;
                case "base64":
                    ret = base64ToBytes(str).length;
                    break;
                default:
                    ret = str.length
            }
            return ret
        }, Buffer.prototype.length = void 0, Buffer.prototype.parent = void 0, Buffer.prototype.toString = function(encoding, start, end) {
            var loweredCase = !1;
            if (start >>>= 0, end = void 0 === end || end === 1 / 0 ? this.length : end >>> 0, encoding || (encoding = "utf8"), 0 > start && (start = 0), end > this.length && (end = this.length), start >= end) return "";
            for (;;) switch (encoding) {
                case "hex":
                    return hexSlice(this, start, end);
                case "utf8":
                case "utf-8":
                    return utf8Slice(this, start, end);
                case "ascii":
                    return asciiSlice(this, start, end);
                case "binary":
                    return binarySlice(this, start, end);
                case "base64":
                    return base64Slice(this, start, end);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    return utf16leSlice(this, start, end);
                default:
                    if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
                    encoding = (encoding + "").toLowerCase(), loweredCase = !0
            }
        }, Buffer.prototype.equals = function(b) {
            if (!Buffer.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
            return this === b ? !0 : 0 === Buffer.compare(this, b)
        }, Buffer.prototype.inspect = function() {
            var str = "",
                max = exports.INSPECT_MAX_BYTES;
            return this.length > 0 && (str = this.toString("hex", 0, max).match(/.{2}/g).join(" "), this.length > max && (str += " ... ")), "<Buffer " + str + ">"
        }, Buffer.prototype.compare = function(b) {
            if (!Buffer.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
            return this === b ? 0 : Buffer.compare(this, b)
        }, Buffer.prototype.indexOf = function(val, byteOffset) {
            function arrayIndexOf(arr, val, byteOffset) {
                for (var foundIndex = -1, i = 0; byteOffset + i < arr.length; i++)
                    if (arr[byteOffset + i] === val[-1 === foundIndex ? 0 : i - foundIndex]) {
                        if (-1 === foundIndex && (foundIndex = i), i - foundIndex + 1 === val.length) return byteOffset + foundIndex
                    } else foundIndex = -1;
                return -1
            }
            if (byteOffset > 2147483647 ? byteOffset = 2147483647 : -2147483648 > byteOffset && (byteOffset = -2147483648), byteOffset >>= 0, 0 === this.length) return -1;
            if (byteOffset >= this.length) return -1;
            if (0 > byteOffset && (byteOffset = Math.max(this.length + byteOffset, 0)), "string" == typeof val) return 0 === val.length ? -1 : String.prototype.indexOf.call(this, val, byteOffset);
            if (Buffer.isBuffer(val)) return arrayIndexOf(this, val, byteOffset);
            if ("number" == typeof val) return Buffer.TYPED_ARRAY_SUPPORT && "function" === Uint8Array.prototype.indexOf ? Uint8Array.prototype.indexOf.call(this, val, byteOffset) : arrayIndexOf(this, [val], byteOffset);
            throw new TypeError("val must be string, number or Buffer")
        }, Buffer.prototype.get = function(offset) {
            return console.log(".get() is deprecated. Access using array indexes instead."), this.readUInt8(offset)
        }, Buffer.prototype.set = function(v, offset) {
            return console.log(".set() is deprecated. Access using array indexes instead."), this.writeUInt8(v, offset)
        }, Buffer.prototype.write = function(string, offset, length, encoding) {
            if (isFinite(offset)) isFinite(length) || (encoding = length, length = void 0);
            else {
                var swap = encoding;
                encoding = offset, offset = length, length = swap
            }
            if (offset = Number(offset) || 0, 0 > length || 0 > offset || offset > this.length) throw new RangeError("attempt to write outside buffer bounds");
            var remaining = this.length - offset;
            length ? (length = Number(length), length > remaining && (length = remaining)) : length = remaining, encoding = String(encoding || "utf8").toLowerCase();
            var ret;
            switch (encoding) {
                case "hex":
                    ret = hexWrite(this, string, offset, length);
                    break;
                case "utf8":
                case "utf-8":
                    ret = utf8Write(this, string, offset, length);
                    break;
                case "ascii":
                    ret = asciiWrite(this, string, offset, length);
                    break;
                case "binary":
                    ret = binaryWrite(this, string, offset, length);
                    break;
                case "base64":
                    ret = base64Write(this, string, offset, length);
                    break;
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    ret = utf16leWrite(this, string, offset, length);
                    break;
                default:
                    throw new TypeError("Unknown encoding: " + encoding)
            }
            return ret
        }, Buffer.prototype.toJSON = function() {
            return {
                type: "Buffer",
                data: Array.prototype.slice.call(this._arr || this, 0)
            }
        }, Buffer.prototype.slice = function(start, end) {
            var len = this.length;
            start = ~~start, end = void 0 === end ? len : ~~end, 0 > start ? (start += len, 0 > start && (start = 0)) : start > len && (start = len), 0 > end ? (end += len, 0 > end && (end = 0)) : end > len && (end = len), start > end && (end = start);
            var newBuf;
            if (Buffer.TYPED_ARRAY_SUPPORT) newBuf = Buffer._augment(this.subarray(start, end));
            else {
                var sliceLen = end - start;
                newBuf = new Buffer(sliceLen, void 0);
                for (var i = 0; sliceLen > i; i++) newBuf[i] = this[i + start]
            }
            return newBuf.length && (newBuf.parent = this.parent || this), newBuf
        }, Buffer.prototype.readUIntLE = function(offset, byteLength, noAssert) {
            offset >>>= 0, byteLength >>>= 0, noAssert || checkOffset(offset, byteLength, this.length);
            for (var val = this[offset], mul = 1, i = 0; ++i < byteLength && (mul *= 256);) val += this[offset + i] * mul;
            return val
        }, Buffer.prototype.readUIntBE = function(offset, byteLength, noAssert) {
            offset >>>= 0, byteLength >>>= 0, noAssert || checkOffset(offset, byteLength, this.length);
            for (var val = this[offset + --byteLength], mul = 1; byteLength > 0 && (mul *= 256);) val += this[offset + --byteLength] * mul;
            return val
        }, Buffer.prototype.readUInt8 = function(offset, noAssert) {
            return noAssert || checkOffset(offset, 1, this.length), this[offset]
        }, Buffer.prototype.readUInt16LE = function(offset, noAssert) {
            return noAssert || checkOffset(offset, 2, this.length), this[offset] | this[offset + 1] << 8
        }, Buffer.prototype.readUInt16BE = function(offset, noAssert) {
            return noAssert || checkOffset(offset, 2, this.length), this[offset] << 8 | this[offset + 1]
        }, Buffer.prototype.readUInt32LE = function(offset, noAssert) {
            return noAssert || checkOffset(offset, 4, this.length), (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + 16777216 * this[offset + 3]
        }, Buffer.prototype.readUInt32BE = function(offset, noAssert) {
            return noAssert || checkOffset(offset, 4, this.length), 16777216 * this[offset] + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3])
        }, Buffer.prototype.readIntLE = function(offset, byteLength, noAssert) {
            offset >>>= 0, byteLength >>>= 0, noAssert || checkOffset(offset, byteLength, this.length);
            for (var val = this[offset], mul = 1, i = 0; ++i < byteLength && (mul *= 256);) val += this[offset + i] * mul;
            return mul *= 128, val >= mul && (val -= Math.pow(2, 8 * byteLength)), val
        }, Buffer.prototype.readIntBE = function(offset, byteLength, noAssert) {
            offset >>>= 0, byteLength >>>= 0, noAssert || checkOffset(offset, byteLength, this.length);
            for (var i = byteLength, mul = 1, val = this[offset + --i]; i > 0 && (mul *= 256);) val += this[offset + --i] * mul;
            return mul *= 128, val >= mul && (val -= Math.pow(2, 8 * byteLength)), val
        }, Buffer.prototype.readInt8 = function(offset, noAssert) {
            return noAssert || checkOffset(offset, 1, this.length), 128 & this[offset] ? -1 * (255 - this[offset] + 1) : this[offset]
        }, Buffer.prototype.readInt16LE = function(offset, noAssert) {
            noAssert || checkOffset(offset, 2, this.length);
            var val = this[offset] | this[offset + 1] << 8;
            return 32768 & val ? 4294901760 | val : val
        }, Buffer.prototype.readInt16BE = function(offset, noAssert) {
            noAssert || checkOffset(offset, 2, this.length);
            var val = this[offset + 1] | this[offset] << 8;
            return 32768 & val ? 4294901760 | val : val
        }, Buffer.prototype.readInt32LE = function(offset, noAssert) {
            return noAssert || checkOffset(offset, 4, this.length), this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24
        }, Buffer.prototype.readInt32BE = function(offset, noAssert) {
            return noAssert || checkOffset(offset, 4, this.length), this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]
        }, Buffer.prototype.readFloatLE = function(offset, noAssert) {
            return noAssert || checkOffset(offset, 4, this.length), ieee754.read(this, offset, !0, 23, 4)
        }, Buffer.prototype.readFloatBE = function(offset, noAssert) {
            return noAssert || checkOffset(offset, 4, this.length), ieee754.read(this, offset, !1, 23, 4)
        }, Buffer.prototype.readDoubleLE = function(offset, noAssert) {
            return noAssert || checkOffset(offset, 8, this.length), ieee754.read(this, offset, !0, 52, 8)
        }, Buffer.prototype.readDoubleBE = function(offset, noAssert) {
            return noAssert || checkOffset(offset, 8, this.length), ieee754.read(this, offset, !1, 52, 8)
        }, Buffer.prototype.writeUIntLE = function(value, offset, byteLength, noAssert) {
            value = +value, offset >>>= 0, byteLength >>>= 0, noAssert || checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0);
            var mul = 1,
                i = 0;
            for (this[offset] = 255 & value; ++i < byteLength && (mul *= 256);) this[offset + i] = value / mul >>> 0 & 255;
            return offset + byteLength
        }, Buffer.prototype.writeUIntBE = function(value, offset, byteLength, noAssert) {
            value = +value, offset >>>= 0, byteLength >>>= 0, noAssert || checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0);
            var i = byteLength - 1,
                mul = 1;
            for (this[offset + i] = 255 & value; --i >= 0 && (mul *= 256);) this[offset + i] = value / mul >>> 0 & 255;
            return offset + byteLength
        }, Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
            return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 1, 255, 0), Buffer.TYPED_ARRAY_SUPPORT || (value = Math.floor(value)), this[offset] = value, offset + 1
        }, Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
            return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 2, 65535, 0), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = value, this[offset + 1] = value >>> 8) : objectWriteUInt16(this, value, offset, !0), offset + 2
        }, Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
            return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 2, 65535, 0), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = value >>> 8, this[offset + 1] = value) : objectWriteUInt16(this, value, offset, !1), offset + 2
        }, Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
            return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 4, 4294967295, 0), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset + 3] = value >>> 24, this[offset + 2] = value >>> 16, this[offset + 1] = value >>> 8, this[offset] = value) : objectWriteUInt32(this, value, offset, !0), offset + 4
        }, Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
            return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 4, 4294967295, 0), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = value >>> 24, this[offset + 1] = value >>> 16, this[offset + 2] = value >>> 8, this[offset + 3] = value) : objectWriteUInt32(this, value, offset, !1), offset + 4
        }, Buffer.prototype.writeIntLE = function(value, offset, byteLength, noAssert) {
            value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength - 1) - 1, -Math.pow(2, 8 * byteLength - 1));
            var i = 0,
                mul = 1,
                sub = 0 > value ? 1 : 0;
            for (this[offset] = 255 & value; ++i < byteLength && (mul *= 256);) this[offset + i] = (value / mul >> 0) - sub & 255;
            return offset + byteLength
        }, Buffer.prototype.writeIntBE = function(value, offset, byteLength, noAssert) {
            value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength - 1) - 1, -Math.pow(2, 8 * byteLength - 1));
            var i = byteLength - 1,
                mul = 1,
                sub = 0 > value ? 1 : 0;
            for (this[offset + i] = 255 & value; --i >= 0 && (mul *= 256);) this[offset + i] = (value / mul >> 0) - sub & 255;
            return offset + byteLength
        }, Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
            return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 1, 127, -128), Buffer.TYPED_ARRAY_SUPPORT || (value = Math.floor(value)), 0 > value && (value = 255 + value + 1), this[offset] = value, offset + 1
        }, Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
            return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 2, 32767, -32768), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = value, this[offset + 1] = value >>> 8) : objectWriteUInt16(this, value, offset, !0), offset + 2
        }, Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
            return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 2, 32767, -32768), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = value >>> 8, this[offset + 1] = value) : objectWriteUInt16(this, value, offset, !1), offset + 2
        }, Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
            return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 4, 2147483647, -2147483648), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = value, this[offset + 1] = value >>> 8, this[offset + 2] = value >>> 16, this[offset + 3] = value >>> 24) : objectWriteUInt32(this, value, offset, !0), offset + 4
        }, Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
            return value = +value, offset >>>= 0, noAssert || checkInt(this, value, offset, 4, 2147483647, -2147483648), 0 > value && (value = 4294967295 + value + 1), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = value >>> 24, this[offset + 1] = value >>> 16, this[offset + 2] = value >>> 8, this[offset + 3] = value) : objectWriteUInt32(this, value, offset, !1), offset + 4
        }, Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
            return writeFloat(this, value, offset, !0, noAssert)
        }, Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
            return writeFloat(this, value, offset, !1, noAssert)
        }, Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
            return writeDouble(this, value, offset, !0, noAssert)
        }, Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
            return writeDouble(this, value, offset, !1, noAssert)
        }, Buffer.prototype.copy = function(target, target_start, start, end) {
            var self = this;
            if (start || (start = 0), end || 0 === end || (end = this.length), target_start >= target.length && (target_start = target.length), target_start || (target_start = 0), end > 0 && start > end && (end = start), end === start) return 0;
            if (0 === target.length || 0 === self.length) return 0;
            if (0 > target_start) throw new RangeError("targetStart out of bounds");
            if (0 > start || start >= self.length) throw new RangeError("sourceStart out of bounds");
            if (0 > end) throw new RangeError("sourceEnd out of bounds");
            end > this.length && (end = this.length), target.length - target_start < end - start && (end = target.length - target_start + start);
            var len = end - start;
            if (1e3 > len || !Buffer.TYPED_ARRAY_SUPPORT)
                for (var i = 0; len > i; i++) target[i + target_start] = this[i + start];
            else target._set(this.subarray(start, start + len), target_start);
            return len
        }, Buffer.prototype.fill = function(value, start, end) {
            if (value || (value = 0), start || (start = 0), end || (end = this.length), start > end) throw new RangeError("end < start");
            if (end !== start && 0 !== this.length) {
                if (0 > start || start >= this.length) throw new RangeError("start out of bounds");
                if (0 > end || end > this.length) throw new RangeError("end out of bounds");
                var i;
                if ("number" == typeof value)
                    for (i = start; end > i; i++) this[i] = value;
                else {
                    var bytes = utf8ToBytes(value.toString()),
                        len = bytes.length;
                    for (i = start; end > i; i++) this[i] = bytes[i % len]
                }
                return this
            }
        }, Buffer.prototype.toArrayBuffer = function() {
            if ("undefined" != typeof Uint8Array) {
                if (Buffer.TYPED_ARRAY_SUPPORT) return new Buffer(this).buffer;
                for (var buf = new Uint8Array(this.length), i = 0, len = buf.length; len > i; i += 1) buf[i] = this[i];
                return buf.buffer
            }
            throw new TypeError("Buffer.toArrayBuffer not supported in this browser")
        };
        var BP = Buffer.prototype;
        Buffer._augment = function(arr) {
            return arr.constructor = Buffer, arr._isBuffer = !0, arr._get = arr.get, arr._set = arr.set, arr.get = BP.get, arr.set = BP.set, arr.write = BP.write, arr.toString = BP.toString, arr.toLocaleString = BP.toString, arr.toJSON = BP.toJSON, arr.equals = BP.equals, arr.compare = BP.compare, arr.indexOf = BP.indexOf, arr.copy = BP.copy, arr.slice = BP.slice, arr.readUIntLE = BP.readUIntLE, arr.readUIntBE = BP.readUIntBE, arr.readUInt8 = BP.readUInt8, arr.readUInt16LE = BP.readUInt16LE, arr.readUInt16BE = BP.readUInt16BE, arr.readUInt32LE = BP.readUInt32LE, arr.readUInt32BE = BP.readUInt32BE, arr.readIntLE = BP.readIntLE, arr.readIntBE = BP.readIntBE, arr.readInt8 = BP.readInt8, arr.readInt16LE = BP.readInt16LE, arr.readInt16BE = BP.readInt16BE, arr.readInt32LE = BP.readInt32LE, arr.readInt32BE = BP.readInt32BE, arr.readFloatLE = BP.readFloatLE, arr.readFloatBE = BP.readFloatBE, arr.readDoubleLE = BP.readDoubleLE, arr.readDoubleBE = BP.readDoubleBE, arr.writeUInt8 = BP.writeUInt8, arr.writeUIntLE = BP.writeUIntLE, arr.writeUIntBE = BP.writeUIntBE, arr.writeUInt16LE = BP.writeUInt16LE, arr.writeUInt16BE = BP.writeUInt16BE, arr.writeUInt32LE = BP.writeUInt32LE, arr.writeUInt32BE = BP.writeUInt32BE, arr.writeIntLE = BP.writeIntLE, arr.writeIntBE = BP.writeIntBE, arr.writeInt8 = BP.writeInt8, arr.writeInt16LE = BP.writeInt16LE, arr.writeInt16BE = BP.writeInt16BE, arr.writeInt32LE = BP.writeInt32LE, arr.writeInt32BE = BP.writeInt32BE, arr.writeFloatLE = BP.writeFloatLE, arr.writeFloatBE = BP.writeFloatBE, arr.writeDoubleLE = BP.writeDoubleLE, arr.writeDoubleBE = BP.writeDoubleBE, arr.fill = BP.fill, arr.inspect = BP.inspect, arr.toArrayBuffer = BP.toArrayBuffer, arr
        };
        var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g
    }, {
        "base64-js": 171,
        ieee754: 172,
        "is-array": 173
    }],
    171: [function(require, module, exports) {
        var lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        ! function(exports) {
            "use strict";

            function decode(elt) {
                var code = elt.charCodeAt(0);
                return code === PLUS || code === PLUS_URL_SAFE ? 62 : code === SLASH || code === SLASH_URL_SAFE ? 63 : NUMBER > code ? -1 : NUMBER + 10 > code ? code - NUMBER + 26 + 26 : UPPER + 26 > code ? code - UPPER : LOWER + 26 > code ? code - LOWER + 26 : void 0
            }

            function b64ToByteArray(b64) {
                function push(v) {
                    arr[L++] = v
                }
                var i, j, l, tmp, placeHolders, arr;
                if (b64.length % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
                var len = b64.length;
                placeHolders = "=" === b64.charAt(len - 2) ? 2 : "=" === b64.charAt(len - 1) ? 1 : 0, arr = new Arr(3 * b64.length / 4 - placeHolders), l = placeHolders > 0 ? b64.length - 4 : b64.length;
                var L = 0;
                for (i = 0, j = 0; l > i; i += 4, j += 3) tmp = decode(b64.charAt(i)) << 18 | decode(b64.charAt(i + 1)) << 12 | decode(b64.charAt(i + 2)) << 6 | decode(b64.charAt(i + 3)), push((16711680 & tmp) >> 16), push((65280 & tmp) >> 8), push(255 & tmp);
                return 2 === placeHolders ? (tmp = decode(b64.charAt(i)) << 2 | decode(b64.charAt(i + 1)) >> 4, push(255 & tmp)) : 1 === placeHolders && (tmp = decode(b64.charAt(i)) << 10 | decode(b64.charAt(i + 1)) << 4 | decode(b64.charAt(i + 2)) >> 2, push(tmp >> 8 & 255), push(255 & tmp)), arr
            }

            function uint8ToBase64(uint8) {
                function encode(num) {
                    return lookup.charAt(num)
                }

                function tripletToBase64(num) {
                    return encode(num >> 18 & 63) + encode(num >> 12 & 63) + encode(num >> 6 & 63) + encode(63 & num)
                }
                var i, temp, length, extraBytes = uint8.length % 3,
                    output = "";
                for (i = 0, length = uint8.length - extraBytes; length > i; i += 3) temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2], output += tripletToBase64(temp);
                switch (extraBytes) {
                    case 1:
                        temp = uint8[uint8.length - 1], output += encode(temp >> 2), output += encode(temp << 4 & 63), output += "==";
                        break;
                    case 2:
                        temp = (uint8[uint8.length - 2] << 8) + uint8[uint8.length - 1], output += encode(temp >> 10), output += encode(temp >> 4 & 63), output += encode(temp << 2 & 63), output += "="
                }
                return output
            }
            var Arr = "undefined" != typeof Uint8Array ? Uint8Array : Array,
                PLUS = "+".charCodeAt(0),
                SLASH = "/".charCodeAt(0),
                NUMBER = "0".charCodeAt(0),
                LOWER = "a".charCodeAt(0),
                UPPER = "A".charCodeAt(0),
                PLUS_URL_SAFE = "-".charCodeAt(0),
                SLASH_URL_SAFE = "_".charCodeAt(0);
            exports.toByteArray = b64ToByteArray, exports.fromByteArray = uint8ToBase64
        }("undefined" == typeof exports ? this.base64js = {} : exports)
    }, {}],
    172: [function(require, module, exports) {
        exports.read = function(buffer, offset, isLE, mLen, nBytes) {
            var e, m, eLen = 8 * nBytes - mLen - 1,
                eMax = (1 << eLen) - 1,
                eBias = eMax >> 1,
                nBits = -7,
                i = isLE ? nBytes - 1 : 0,
                d = isLE ? -1 : 1,
                s = buffer[offset + i];
            for (i += d, e = s & (1 << -nBits) - 1, s >>= -nBits, nBits += eLen; nBits > 0; e = 256 * e + buffer[offset + i], i += d, nBits -= 8);
            for (m = e & (1 << -nBits) - 1, e >>= -nBits, nBits += mLen; nBits > 0; m = 256 * m + buffer[offset + i], i += d, nBits -= 8);
            if (0 === e) e = 1 - eBias;
            else {
                if (e === eMax) return m ? 0 / 0 : (s ? -1 : 1) * (1 / 0);
                m += Math.pow(2, mLen), e -= eBias
            }
            return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
        }, exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
            var e, m, c, eLen = 8 * nBytes - mLen - 1,
                eMax = (1 << eLen) - 1,
                eBias = eMax >> 1,
                rt = 23 === mLen ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
                i = isLE ? 0 : nBytes - 1,
                d = isLE ? 1 : -1,
                s = 0 > value || 0 === value && 0 > 1 / value ? 1 : 0;
            for (value = Math.abs(value), isNaN(value) || value === 1 / 0 ? (m = isNaN(value) ? 1 : 0, e = eMax) : (e = Math.floor(Math.log(value) / Math.LN2), value * (c = Math.pow(2, -e)) < 1 && (e--, c *= 2), value += e + eBias >= 1 ? rt / c : rt * Math.pow(2, 1 - eBias), value * c >= 2 && (e++, c /= 2), e + eBias >= eMax ? (m = 0, e = eMax) : e + eBias >= 1 ? (m = (value * c - 1) * Math.pow(2, mLen), e += eBias) : (m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen), e = 0)); mLen >= 8; buffer[offset + i] = 255 & m, i += d, m /= 256, mLen -= 8);
            for (e = e << mLen | m, eLen += mLen; eLen > 0; buffer[offset + i] = 255 & e, i += d, e /= 256, eLen -= 8);
            buffer[offset + i - d] |= 128 * s
        }
    }, {}],
    173: [function(require, module, exports) {
        arguments[4][115][0].apply(exports, arguments)
    }, {
        dup: 115
    }],
    174: [function(require, module) {
        function parse(html, doc) {
            if ("string" != typeof html) throw new TypeError("String expected");
            doc || (doc = document);
            var m = /<([\w:]+)/.exec(html);
            if (!m) return doc.createTextNode(html);
            html = html.replace(/^\s+|\s+$/g, "");
            var tag = m[1];
            if ("body" == tag) {
                var el = doc.createElement("html");
                return el.innerHTML = html, el.removeChild(el.lastChild)
            }
            var wrap = map[tag] || map._default,
                depth = wrap[0],
                prefix = wrap[1],
                suffix = wrap[2],
                el = doc.createElement("div");
            for (el.innerHTML = prefix + html + suffix; depth--;) el = el.lastChild;
            if (el.firstChild == el.lastChild) return el.removeChild(el.firstChild);
            for (var fragment = doc.createDocumentFragment(); el.firstChild;) fragment.appendChild(el.removeChild(el.firstChild));
            return fragment
        }
        module.exports = parse;
        var div = document.createElement("div");
        div.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
        var innerHTMLBug = !div.getElementsByTagName("link").length;
        div = void 0;
        var map = {
            legend: [1, "<fieldset>", "</fieldset>"],
            tr: [2, "<table><tbody>", "</tbody></table>"],
            col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
            _default: innerHTMLBug ? [1, "X<div>", "</div>"] : [0, "", ""]
        };
        map.td = map.th = [3, "<table><tbody><tr>", "</tr></tbody></table>"], map.option = map.optgroup = [1, '<select multiple="multiple">', "</select>"], map.thead = map.tbody = map.colgroup = map.caption = map.tfoot = [1, "<table>", "</table>"], map.polyline = map.ellipse = map.polygon = map.circle = map.text = map.line = map.path = map.rect = map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">', "</svg>"]
    }, {}],
    175: [function(require, module) {
        ! function(name, definition) {
            "undefined" != typeof module ? module.exports = definition() : "function" == typeof define && "object" == typeof define.amd ? define(definition) : this[name] = definition()
        }("domready", function() {
            var listener, fns = [],
                doc = document,
                hack = doc.documentElement.doScroll,
                domContentLoaded = "DOMContentLoaded",
                loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState);
            return loaded || doc.addEventListener(domContentLoaded, listener = function() {
                    for (doc.removeEventListener(domContentLoaded, listener), loaded = 1; listener = fns.shift();) listener()
                }),
                function(fn) {
                    loaded ? fn() : fns.push(fn)
                }
        })
    }, {}],
    176: [function(require, module) {
        function Events(el, obj) {
            if (!(this instanceof Events)) return new Events(el, obj);
            if (!el) throw new Error("element required");
            if (!obj) throw new Error("object required");
            this.el = el, this.obj = obj, this._events = {}
        }

        function parse(event) {
            var parts = event.split(/ +/);
            return {
                name: parts.shift(),
                selector: parts.join(" ")
            }
        }
        var events = require("component-event"),
            delegate = require("delegate-events"),
            forceCaptureEvents = ["focus", "blur"];
        module.exports = Events, Events.prototype.sub = function(event, method, cb) {
            this._events[event] = this._events[event] || {}, this._events[event][method] = cb
        }, Events.prototype.bind = function(event, method) {
            function cb() {
                var a = [].slice.call(arguments).concat(args);
                if ("function" == typeof method) return void method.apply(obj, a);
                if (!obj[method]) throw new Error(method + " method is not defined");
                obj[method].apply(obj, a)
            }
            var e = parse(event),
                el = this.el,
                obj = this.obj,
                name = e.name,
                method = method || "on" + name,
                args = [].slice.call(arguments, 2);
            return e.selector ? cb = delegate.bind(el, e.selector, name, cb) : events.bind(el, name, cb), this.sub(name, method, cb), cb
        }, Events.prototype.unbind = function(event, method) {
            if (0 == arguments.length) return this.unbindAll();
            if (1 == arguments.length) return this.unbindAllOf(event);
            var bindings = this._events[event],
                capture = -1 !== forceCaptureEvents.indexOf(event);
            if (bindings) {
                var cb = bindings[method];
                cb && events.unbind(this.el, event, cb, capture)
            }
        }, Events.prototype.unbindAll = function() {
            for (var event in this._events) this.unbindAllOf(event)
        }, Events.prototype.unbindAllOf = function(event) {
            var bindings = this._events[event];
            if (bindings)
                for (var method in bindings) this.unbind(event, method)
        }
    }, {
        "component-event": 177,
        "delegate-events": 178
    }],
    177: [function(require, module, exports) {
        var bind = window.addEventListener ? "addEventListener" : "attachEvent",
            unbind = window.removeEventListener ? "removeEventListener" : "detachEvent",
            prefix = "addEventListener" !== bind ? "on" : "";
        exports.bind = function(el, type, fn, capture) {
            return el[bind](prefix + type, fn, capture || !1), fn
        }, exports.unbind = function(el, type, fn, capture) {
            return el[unbind](prefix + type, fn, capture || !1), fn
        }
    }, {}],
    178: [function(require, module, exports) {
        var closest = require("closest"),
            event = require("event"),
            forceCaptureEvents = ["focus", "blur"];
        exports.bind = function(el, selector, type, fn, capture) {
            return -1 !== forceCaptureEvents.indexOf(type) && (capture = !0), event.bind(el, type, function(e) {
                var target = e.target || e.srcElement;
                e.delegateTarget = closest(target, selector, !0, el), e.delegateTarget && fn.call(el, e)
            }, capture)
        }, exports.unbind = function(el, type, fn, capture) {
            -1 !== forceCaptureEvents.indexOf(type) && (capture = !0), event.unbind(el, type, fn, capture)
        }
    }, {
        closest: 179,
        event: 177
    }],
    179: [function(require, module) {
        var matches = require("matches-selector");
        module.exports = function(element, selector, checkYoSelf) {
            for (var parent = checkYoSelf ? element : element.parentNode; parent && parent !== document;) {
                if (matches(parent, selector)) return parent;
                parent = parent.parentNode
            }
        }
    }, {
        "matches-selector": 180
    }],
    180: [function(require, module) {
        function match(el, selector) {
            if (vendor) return vendor.call(el, selector);
            for (var nodes = el.parentNode.querySelectorAll(selector), i = 0; i < nodes.length; ++i)
                if (nodes[i] == el) return !0;
            return !1
        }
        var proto = Element.prototype,
            vendor = proto.matchesSelector || proto.webkitMatchesSelector || proto.mozMatchesSelector || proto.msMatchesSelector || proto.oMatchesSelector;
        module.exports = match
    }, {}],
    181: [function(require, module) {
        "use strict";
        var keyMirror = function(obj) {
            var key, ret = {};
            if (!(obj instanceof Object) || Array.isArray(obj)) throw new Error("keyMirror(...): Argument must be an object.");
            for (key in obj) obj.hasOwnProperty(key) && (ret[key] = key);
            return ret
        };
        module.exports = keyMirror
    }, {}],
    182: [function(require, module) {
        "use strict";
        var stripIndent = require("strip-indent"),
            reCommentContents = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)[ \t]*\*\//,
            multiline = module.exports = function(fn) {
                if ("function" != typeof fn) throw new TypeError("Expected a function");
                var match = reCommentContents.exec(fn.toString());
                if (!match) throw new TypeError("Multiline comment missing.");
                return match[1]
            };
        multiline.stripIndent = function(fn) {
            return stripIndent(multiline(fn))
        }
    }, {
        "strip-indent": 183
    }],
    183: [function(require, module) {
        "use strict";
        module.exports = function(str) {
            var match = str.match(/^[ \t]*(?=\S)/gm);
            if (!match) return str;
            var indent = Math.min.apply(Math, match.map(function(el) {
                    return el.length
                })),
                re = new RegExp("^[ \\t]{" + indent + "}", "gm");
            return indent > 0 ? str.replace(re, "") : str
        }
    }, {}],
    184: [function() {
        /*
         * @version    1.3.1
         * @date       2015-03-02
         * @stability  3 - Stable
         * @author     Lauri Rooden (https://github.com/litejs/natural-compare-lite)
         * @license    MIT License
         */
        String.naturalCompare = function(a, b) {
            function getCode(str, pos, code) {
                if (code) {
                    for (i = pos; code = getCode(str, i), 76 > code && code > 65;) ++i;
                    return +str.slice(pos - 1, i)
                }
                return code = alphabet && alphabet.indexOf(str.charAt(pos)), code > -1 ? code + 76 : (code = str.charCodeAt(pos) || 0, 45 > code || code > 127 ? code : 46 > code ? 65 : 48 > code ? code - 1 : 58 > code ? code + 18 : 65 > code ? code - 11 : 91 > code ? code + 11 : 97 > code ? code - 37 : 123 > code ? code + 5 : code - 63)
            }
            var i, codeA, codeB = 1,
                posA = 0,
                posB = 0,
                alphabet = String.alphabet;
            if ((a += "") != (b += ""))
                for (; codeB;)
                    if (codeA = getCode(a, posA++), codeB = getCode(b, posB++), 76 > codeA && 76 > codeB && codeA > 66 && codeB > 66 && (codeA = getCode(a, posA, posA), codeB = getCode(b, posB, posA = i), posB = i), codeA != codeB) return codeB > codeA ? -1 : 1;
            return 0
        }
    }, {}],
    185: [function(require, module) {
        ! function() {
            "use strict";
            var encodeNumber = function(num) {
                    for (var nextValue, finalValue, encodeString = ""; num >= 32;) nextValue = (32 | 31 & num) + 63, encodeString += String.fromCharCode(nextValue), num >>= 5;
                    return finalValue = num + 63, encodeString += String.fromCharCode(finalValue)
                },
                encodeSignedNumber = function(num) {
                    var sgn_num = num << 1;
                    return 0 > num && (sgn_num = ~sgn_num), encodeNumber(sgn_num)
                },
                getLat = function(latlng) {
                    return latlng.lat ? latlng.lat : latlng[0]
                },
                getLng = function(latlng) {
                    return latlng.lng ? latlng.lng : latlng[1]
                },
                PolylineUtil = {
                    encode: function(latlngs, precision) {
                        var i, dlat, dlng, plat = 0,
                            plng = 0,
                            encoded_points = "";
                        for (precision = Math.pow(10, precision || 5), i = 0; i < latlngs.length; i++) {
                            var lat = getLat(latlngs[i]),
                                lng = getLng(latlngs[i]),
                                latFloored = Math.floor(lat * precision),
                                lngFloored = Math.floor(lng * precision);
                            dlat = latFloored - plat, dlng = lngFloored - plng, plat = latFloored, plng = lngFloored, encoded_points += encodeSignedNumber(dlat) + encodeSignedNumber(dlng)
                        }
                        return encoded_points
                    },
                    decode: function(encoded, precision) {
                        var len = encoded.length,
                            index = 0,
                            latlngs = [],
                            lat = 0,
                            lng = 0;
                        for (precision = Math.pow(10, -(precision || 5)); len > index;) {
                            var b, shift = 0,
                                result = 0;
                            do b = encoded.charCodeAt(index++) - 63, result |= (31 & b) << shift, shift += 5; while (b >= 32);
                            var dlat = 1 & result ? ~(result >> 1) : result >> 1;
                            lat += dlat, shift = 0, result = 0;
                            do b = encoded.charCodeAt(index++) - 63, result |= (31 & b) << shift, shift += 5; while (b >= 32);
                            var dlng = 1 & result ? ~(result >> 1) : result >> 1;
                            lng += dlng, latlngs.push([lat * precision, lng * precision])
                        }
                        return latlngs
                    }
                };
            if ("object" == typeof module && "object" == typeof module.exports && (module.exports = PolylineUtil), "object" == typeof L) {
                L.Polyline.prototype.fromEncoded || (L.Polyline.fromEncoded = function(encoded, options) {
                    return new L.Polyline(PolylineUtil.decode(encoded), options)
                }), L.Polygon.prototype.fromEncoded || (L.Polygon.fromEncoded = function(encoded, options) {
                    return new L.Polygon(PolylineUtil.decode(encoded), options)
                });
                var encodeMixin = {
                    encodePath: function() {
                        return PolylineUtil.encode(this.getLatLngs())
                    }
                };
                L.Polyline.prototype.encodePath || L.Polyline.include(encodeMixin), L.Polygon.prototype.encodePath || L.Polygon.include(encodeMixin), L.PolylineUtil = PolylineUtil
            }
        }()
    }, {}],
    186: [function(require, module) {
        ! function() {
            function inputToRGB(color) {
                var rgb = {
                        r: 0,
                        g: 0,
                        b: 0
                    },
                    a = 1,
                    ok = !1,
                    format = !1;
                return "string" == typeof color && (color = stringInputToObject(color)), "object" == typeof color && (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b") ? (rgb = rgbToRgb(color.r, color.g, color.b), ok = !0, format = "%" === String(color.r).substr(-1) ? "prgb" : "rgb") : color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v") ? (color.s = convertToPercentage(color.s), color.v = convertToPercentage(color.v), rgb = hsvToRgb(color.h, color.s, color.v), ok = !0, format = "hsv") : color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("l") && (color.s = convertToPercentage(color.s), color.l = convertToPercentage(color.l), rgb = hslToRgb(color.h, color.s, color.l), ok = !0, format = "hsl"), color.hasOwnProperty("a") && (a = color.a)), a = boundAlpha(a), {
                    ok: ok,
                    format: color.format || format,
                    r: mathMin(255, mathMax(rgb.r, 0)),
                    g: mathMin(255, mathMax(rgb.g, 0)),
                    b: mathMin(255, mathMax(rgb.b, 0)),
                    a: a
                }
            }

            function rgbToRgb(r, g, b) {
                return {
                    r: 255 * bound01(r, 255),
                    g: 255 * bound01(g, 255),
                    b: 255 * bound01(b, 255)
                }
            }

            function rgbToHsl(r, g, b) {
                r = bound01(r, 255), g = bound01(g, 255), b = bound01(b, 255);
                var h, s, max = mathMax(r, g, b),
                    min = mathMin(r, g, b),
                    l = (max + min) / 2;
                if (max == min) h = s = 0;
                else {
                    var d = max - min;
                    switch (s = l > .5 ? d / (2 - max - min) : d / (max + min), max) {
                        case r:
                            h = (g - b) / d + (b > g ? 6 : 0);
                            break;
                        case g:
                            h = (b - r) / d + 2;
                            break;
                        case b:
                            h = (r - g) / d + 4
                    }
                    h /= 6
                }
                return {
                    h: h,
                    s: s,
                    l: l
                }
            }

            function hslToRgb(h, s, l) {
                function hue2rgb(p, q, t) {
                    return 0 > t && (t += 1), t > 1 && (t -= 1), 1 / 6 > t ? p + 6 * (q - p) * t : .5 > t ? q : 2 / 3 > t ? p + (q - p) * (2 / 3 - t) * 6 : p
                }
                var r, g, b;
                if (h = bound01(h, 360), s = bound01(s, 100), l = bound01(l, 100), 0 === s) r = g = b = l;
                else {
                    var q = .5 > l ? l * (1 + s) : l + s - l * s,
                        p = 2 * l - q;
                    r = hue2rgb(p, q, h + 1 / 3), g = hue2rgb(p, q, h), b = hue2rgb(p, q, h - 1 / 3)
                }
                return {
                    r: 255 * r,
                    g: 255 * g,
                    b: 255 * b
                }
            }

            function rgbToHsv(r, g, b) {
                r = bound01(r, 255), g = bound01(g, 255), b = bound01(b, 255);
                var h, s, max = mathMax(r, g, b),
                    min = mathMin(r, g, b),
                    v = max,
                    d = max - min;
                if (s = 0 === max ? 0 : d / max, max == min) h = 0;
                else {
                    switch (max) {
                        case r:
                            h = (g - b) / d + (b > g ? 6 : 0);
                            break;
                        case g:
                            h = (b - r) / d + 2;
                            break;
                        case b:
                            h = (r - g) / d + 4
                    }
                    h /= 6
                }
                return {
                    h: h,
                    s: s,
                    v: v
                }
            }

            function hsvToRgb(h, s, v) {
                h = 6 * bound01(h, 360), s = bound01(s, 100), v = bound01(v, 100);
                var i = math.floor(h),
                    f = h - i,
                    p = v * (1 - s),
                    q = v * (1 - f * s),
                    t = v * (1 - (1 - f) * s),
                    mod = i % 6,
                    r = [v, q, p, p, t, v][mod],
                    g = [t, v, v, q, p, p][mod],
                    b = [p, p, t, v, v, q][mod];
                return {
                    r: 255 * r,
                    g: 255 * g,
                    b: 255 * b
                }
            }

            function rgbToHex(r, g, b, allow3Char) {
                var hex = [pad2(mathRound(r).toString(16)), pad2(mathRound(g).toString(16)), pad2(mathRound(b).toString(16))];
                return allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) ? hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) : hex.join("")
            }

            function rgbaToHex(r, g, b, a) {
                var hex = [pad2(convertDecimalToHex(a)), pad2(mathRound(r).toString(16)), pad2(mathRound(g).toString(16)), pad2(mathRound(b).toString(16))];
                return hex.join("")
            }

            function desaturate(color, amount) {
                amount = 0 === amount ? 0 : amount || 10;
                var hsl = tinycolor(color).toHsl();
                return hsl.s -= amount / 100, hsl.s = clamp01(hsl.s), tinycolor(hsl)
            }

            function saturate(color, amount) {
                amount = 0 === amount ? 0 : amount || 10;
                var hsl = tinycolor(color).toHsl();
                return hsl.s += amount / 100, hsl.s = clamp01(hsl.s), tinycolor(hsl)
            }

            function greyscale(color) {
                return tinycolor(color).desaturate(100)
            }

            function lighten(color, amount) {
                amount = 0 === amount ? 0 : amount || 10;
                var hsl = tinycolor(color).toHsl();
                return hsl.l += amount / 100, hsl.l = clamp01(hsl.l), tinycolor(hsl)
            }

            function brighten(color, amount) {
                amount = 0 === amount ? 0 : amount || 10;
                var rgb = tinycolor(color).toRgb();
                return rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * -(amount / 100)))), rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * -(amount / 100)))), rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * -(amount / 100)))), tinycolor(rgb)
            }

            function darken(color, amount) {
                amount = 0 === amount ? 0 : amount || 10;
                var hsl = tinycolor(color).toHsl();
                return hsl.l -= amount / 100, hsl.l = clamp01(hsl.l), tinycolor(hsl)
            }

            function spin(color, amount) {
                var hsl = tinycolor(color).toHsl(),
                    hue = (mathRound(hsl.h) + amount) % 360;
                return hsl.h = 0 > hue ? 360 + hue : hue, tinycolor(hsl)
            }

            function complement(color) {
                var hsl = tinycolor(color).toHsl();
                return hsl.h = (hsl.h + 180) % 360, tinycolor(hsl)
            }

            function triad(color) {
                var hsl = tinycolor(color).toHsl(),
                    h = hsl.h;
                return [tinycolor(color), tinycolor({
                    h: (h + 120) % 360,
                    s: hsl.s,
                    l: hsl.l
                }), tinycolor({
                    h: (h + 240) % 360,
                    s: hsl.s,
                    l: hsl.l
                })]
            }

            function tetrad(color) {
                var hsl = tinycolor(color).toHsl(),
                    h = hsl.h;
                return [tinycolor(color), tinycolor({
                    h: (h + 90) % 360,
                    s: hsl.s,
                    l: hsl.l
                }), tinycolor({
                    h: (h + 180) % 360,
                    s: hsl.s,
                    l: hsl.l
                }), tinycolor({
                    h: (h + 270) % 360,
                    s: hsl.s,
                    l: hsl.l
                })]
            }

            function splitcomplement(color) {
                var hsl = tinycolor(color).toHsl(),
                    h = hsl.h;
                return [tinycolor(color), tinycolor({
                    h: (h + 72) % 360,
                    s: hsl.s,
                    l: hsl.l
                }), tinycolor({
                    h: (h + 216) % 360,
                    s: hsl.s,
                    l: hsl.l
                })]
            }

            function analogous(color, results, slices) {
                results = results || 6, slices = slices || 30;
                var hsl = tinycolor(color).toHsl(),
                    part = 360 / slices,
                    ret = [tinycolor(color)];
                for (hsl.h = (hsl.h - (part * results >> 1) + 720) % 360; --results;) hsl.h = (hsl.h + part) % 360, ret.push(tinycolor(hsl));
                return ret
            }

            function monochromatic(color, results) {
                results = results || 6;
                for (var hsv = tinycolor(color).toHsv(), h = hsv.h, s = hsv.s, v = hsv.v, ret = [], modification = 1 / results; results--;) ret.push(tinycolor({
                    h: h,
                    s: s,
                    v: v
                })), v = (v + modification) % 1;
                return ret
            }

            function flip(o) {
                var flipped = {};
                for (var i in o) o.hasOwnProperty(i) && (flipped[o[i]] = i);
                return flipped
            }

            function boundAlpha(a) {
                return a = parseFloat(a), (isNaN(a) || 0 > a || a > 1) && (a = 1), a
            }

            function bound01(n, max) {
                isOnePointZero(n) && (n = "100%");
                var processPercent = isPercentage(n);
                return n = mathMin(max, mathMax(0, parseFloat(n))), processPercent && (n = parseInt(n * max, 10) / 100), math.abs(n - max) < 1e-6 ? 1 : n % max / parseFloat(max)
            }

            function clamp01(val) {
                return mathMin(1, mathMax(0, val))
            }

            function parseIntFromHex(val) {
                return parseInt(val, 16)
            }

            function isOnePointZero(n) {
                return "string" == typeof n && -1 != n.indexOf(".") && 1 === parseFloat(n)
            }

            function isPercentage(n) {
                return "string" == typeof n && -1 != n.indexOf("%")
            }

            function pad2(c) {
                return 1 == c.length ? "0" + c : "" + c
            }

            function convertToPercentage(n) {
                return 1 >= n && (n = 100 * n + "%"), n
            }

            function convertDecimalToHex(d) {
                return Math.round(255 * parseFloat(d)).toString(16)
            }

            function convertHexToDecimal(h) {
                return parseIntFromHex(h) / 255
            }

            function stringInputToObject(color) {
                color = color.replace(trimLeft, "").replace(trimRight, "").toLowerCase();
                var named = !1;
                if (names[color]) color = names[color], named = !0;
                else if ("transparent" == color) return {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 0,
                    format: "name"
                };
                var match;
                return (match = matchers.rgb.exec(color)) ? {
                    r: match[1],
                    g: match[2],
                    b: match[3]
                } : (match = matchers.rgba.exec(color)) ? {
                    r: match[1],
                    g: match[2],
                    b: match[3],
                    a: match[4]
                } : (match = matchers.hsl.exec(color)) ? {
                    h: match[1],
                    s: match[2],
                    l: match[3]
                } : (match = matchers.hsla.exec(color)) ? {
                    h: match[1],
                    s: match[2],
                    l: match[3],
                    a: match[4]
                } : (match = matchers.hsv.exec(color)) ? {
                    h: match[1],
                    s: match[2],
                    v: match[3]
                } : (match = matchers.hsva.exec(color)) ? {
                    h: match[1],
                    s: match[2],
                    v: match[3],
                    a: match[4]
                } : (match = matchers.hex8.exec(color)) ? {
                    a: convertHexToDecimal(match[1]),
                    r: parseIntFromHex(match[2]),
                    g: parseIntFromHex(match[3]),
                    b: parseIntFromHex(match[4]),
                    format: named ? "name" : "hex8"
                } : (match = matchers.hex6.exec(color)) ? {
                    r: parseIntFromHex(match[1]),
                    g: parseIntFromHex(match[2]),
                    b: parseIntFromHex(match[3]),
                    format: named ? "name" : "hex"
                } : (match = matchers.hex3.exec(color)) ? {
                    r: parseIntFromHex(match[1] + "" + match[1]),
                    g: parseIntFromHex(match[2] + "" + match[2]),
                    b: parseIntFromHex(match[3] + "" + match[3]),
                    format: named ? "name" : "hex"
                } : !1
            }
            var trimLeft = /^[\s,#]+/,
                trimRight = /\s+$/,
                tinyCounter = 0,
                math = Math,
                mathRound = math.round,
                mathMin = math.min,
                mathMax = math.max,
                mathRandom = math.random,
                tinycolor = function tinycolor(color, opts) {
                    if (color = color ? color : "", opts = opts || {}, color instanceof tinycolor) return color;
                    if (!(this instanceof tinycolor)) return new tinycolor(color, opts);
                    var rgb = inputToRGB(color);
                    this._originalInput = color, this._r = rgb.r, this._g = rgb.g, this._b = rgb.b, this._a = rgb.a, this._roundA = mathRound(100 * this._a) / 100, this._format = opts.format || rgb.format, this._gradientType = opts.gradientType, this._r < 1 && (this._r = mathRound(this._r)), this._g < 1 && (this._g = mathRound(this._g)), this._b < 1 && (this._b = mathRound(this._b)), this._ok = rgb.ok, this._tc_id = tinyCounter++
                };
            tinycolor.prototype = {
                isDark: function() {
                    return this.getBrightness() < 128
                },
                isLight: function() {
                    return !this.isDark()
                },
                isValid: function() {
                    return this._ok
                },
                getOriginalInput: function() {
                    return this._originalInput
                },
                getFormat: function() {
                    return this._format
                },
                getAlpha: function() {
                    return this._a
                },
                getBrightness: function() {
                    var rgb = this.toRgb();
                    return (299 * rgb.r + 587 * rgb.g + 114 * rgb.b) / 1e3
                },
                setAlpha: function(value) {
                    return this._a = boundAlpha(value), this._roundA = mathRound(100 * this._a) / 100, this
                },
                toHsv: function() {
                    var hsv = rgbToHsv(this._r, this._g, this._b);
                    return {
                        h: 360 * hsv.h,
                        s: hsv.s,
                        v: hsv.v,
                        a: this._a
                    }
                },
                toHsvString: function() {
                    var hsv = rgbToHsv(this._r, this._g, this._b),
                        h = mathRound(360 * hsv.h),
                        s = mathRound(100 * hsv.s),
                        v = mathRound(100 * hsv.v);
                    return 1 == this._a ? "hsv(" + h + ", " + s + "%, " + v + "%)" : "hsva(" + h + ", " + s + "%, " + v + "%, " + this._roundA + ")"
                },
                toHsl: function() {
                    var hsl = rgbToHsl(this._r, this._g, this._b);
                    return {
                        h: 360 * hsl.h,
                        s: hsl.s,
                        l: hsl.l,
                        a: this._a
                    }
                },
                toHslString: function() {
                    var hsl = rgbToHsl(this._r, this._g, this._b),
                        h = mathRound(360 * hsl.h),
                        s = mathRound(100 * hsl.s),
                        l = mathRound(100 * hsl.l);
                    return 1 == this._a ? "hsl(" + h + ", " + s + "%, " + l + "%)" : "hsla(" + h + ", " + s + "%, " + l + "%, " + this._roundA + ")"
                },
                toHex: function(allow3Char) {
                    return rgbToHex(this._r, this._g, this._b, allow3Char)
                },
                toHexString: function(allow3Char) {
                    return "#" + this.toHex(allow3Char)
                },
                toHex8: function() {
                    return rgbaToHex(this._r, this._g, this._b, this._a)
                },
                toHex8String: function() {
                    return "#" + this.toHex8()
                },
                toRgb: function() {
                    return {
                        r: mathRound(this._r),
                        g: mathRound(this._g),
                        b: mathRound(this._b),
                        a: this._a
                    }
                },
                toRgbString: function() {
                    return 1 == this._a ? "rgb(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" : "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")"
                },
                toPercentageRgb: function() {
                    return {
                        r: mathRound(100 * bound01(this._r, 255)) + "%",
                        g: mathRound(100 * bound01(this._g, 255)) + "%",
                        b: mathRound(100 * bound01(this._b, 255)) + "%",
                        a: this._a
                    }
                },
                toPercentageRgbString: function() {
                    return 1 == this._a ? "rgb(" + mathRound(100 * bound01(this._r, 255)) + "%, " + mathRound(100 * bound01(this._g, 255)) + "%, " + mathRound(100 * bound01(this._b, 255)) + "%)" : "rgba(" + mathRound(100 * bound01(this._r, 255)) + "%, " + mathRound(100 * bound01(this._g, 255)) + "%, " + mathRound(100 * bound01(this._b, 255)) + "%, " + this._roundA + ")"
                },
                toName: function() {
                    return 0 === this._a ? "transparent" : this._a < 1 ? !1 : hexNames[rgbToHex(this._r, this._g, this._b, !0)] || !1
                },
                toFilter: function(secondColor) {
                    var hex8String = "#" + rgbaToHex(this._r, this._g, this._b, this._a),
                        secondHex8String = hex8String,
                        gradientType = this._gradientType ? "GradientType = 1, " : "";
                    if (secondColor) {
                        var s = tinycolor(secondColor);
                        secondHex8String = s.toHex8String()
                    }
                    return "progid:DXImageTransform.Microsoft.gradient(" + gradientType + "startColorstr=" + hex8String + ",endColorstr=" + secondHex8String + ")"
                },
                toString: function(format) {
                    var formatSet = !!format;
                    format = format || this._format;
                    var formattedString = !1,
                        hasAlpha = this._a < 1 && this._a >= 0,
                        needsAlphaFormat = !formatSet && hasAlpha && ("hex" === format || "hex6" === format || "hex3" === format || "name" === format);
                    return needsAlphaFormat ? "name" === format && 0 === this._a ? this.toName() : this.toRgbString() : ("rgb" === format && (formattedString = this.toRgbString()), "prgb" === format && (formattedString = this.toPercentageRgbString()), ("hex" === format || "hex6" === format) && (formattedString = this.toHexString()), "hex3" === format && (formattedString = this.toHexString(!0)), "hex8" === format && (formattedString = this.toHex8String()), "name" === format && (formattedString = this.toName()), "hsl" === format && (formattedString = this.toHslString()), "hsv" === format && (formattedString = this.toHsvString()), formattedString || this.toHexString())
                },
                _applyModification: function(fn, args) {
                    var color = fn.apply(null, [this].concat([].slice.call(args)));
                    return this._r = color._r, this._g = color._g, this._b = color._b, this.setAlpha(color._a), this
                },
                lighten: function() {
                    return this._applyModification(lighten, arguments)
                },
                brighten: function() {
                    return this._applyModification(brighten, arguments)
                },
                darken: function() {
                    return this._applyModification(darken, arguments)
                },
                desaturate: function() {
                    return this._applyModification(desaturate, arguments)
                },
                saturate: function() {
                    return this._applyModification(saturate, arguments)
                },
                greyscale: function() {
                    return this._applyModification(greyscale, arguments)
                },
                spin: function() {
                    return this._applyModification(spin, arguments)
                },
                _applyCombination: function(fn, args) {
                    return fn.apply(null, [this].concat([].slice.call(args)))
                },
                analogous: function() {
                    return this._applyCombination(analogous, arguments)
                },
                complement: function() {
                    return this._applyCombination(complement, arguments)
                },
                monochromatic: function() {
                    return this._applyCombination(monochromatic, arguments)
                },
                splitcomplement: function() {
                    return this._applyCombination(splitcomplement, arguments)
                },
                triad: function() {
                    return this._applyCombination(triad, arguments)
                },
                tetrad: function() {
                    return this._applyCombination(tetrad, arguments)
                }
            }, tinycolor.fromRatio = function(color, opts) {
                if ("object" == typeof color) {
                    var newColor = {};
                    for (var i in color) color.hasOwnProperty(i) && (newColor[i] = "a" === i ? color[i] : convertToPercentage(color[i]));
                    color = newColor
                }
                return tinycolor(color, opts)
            }, tinycolor.equals = function(color1, color2) {
                return color1 && color2 ? tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString() : !1
            }, tinycolor.random = function() {
                return tinycolor.fromRatio({
                    r: mathRandom(),
                    g: mathRandom(),
                    b: mathRandom()
                })
            }, tinycolor.mix = function(color1, color2, amount) {
                amount = 0 === amount ? 0 : amount || 50;
                var w1, rgb1 = tinycolor(color1).toRgb(),
                    rgb2 = tinycolor(color2).toRgb(),
                    p = amount / 100,
                    w = 2 * p - 1,
                    a = rgb2.a - rgb1.a;
                w1 = w * a == -1 ? w : (w + a) / (1 + w * a), w1 = (w1 + 1) / 2;
                var w2 = 1 - w1,
                    rgba = {
                        r: rgb2.r * w1 + rgb1.r * w2,
                        g: rgb2.g * w1 + rgb1.g * w2,
                        b: rgb2.b * w1 + rgb1.b * w2,
                        a: rgb2.a * p + rgb1.a * (1 - p)
                    };
                return tinycolor(rgba)
            }, tinycolor.readability = function(color1, color2) {
                var c1 = tinycolor(color1),
                    c2 = tinycolor(color2),
                    rgb1 = c1.toRgb(),
                    rgb2 = c2.toRgb(),
                    brightnessA = c1.getBrightness(),
                    brightnessB = c2.getBrightness(),
                    colorDiff = Math.max(rgb1.r, rgb2.r) - Math.min(rgb1.r, rgb2.r) + Math.max(rgb1.g, rgb2.g) - Math.min(rgb1.g, rgb2.g) + Math.max(rgb1.b, rgb2.b) - Math.min(rgb1.b, rgb2.b);
                return {
                    brightness: Math.abs(brightnessA - brightnessB),
                    color: colorDiff
                }
            }, tinycolor.isReadable = function(color1, color2) {
                var readability = tinycolor.readability(color1, color2);
                return readability.brightness > 125 && readability.color > 500
            }, tinycolor.mostReadable = function(baseColor, colorList) {
                for (var bestColor = null, bestScore = 0, bestIsReadable = !1, i = 0; i < colorList.length; i++) {
                    var readability = tinycolor.readability(baseColor, colorList[i]),
                        readable = readability.brightness > 125 && readability.color > 500,
                        score = 3 * (readability.brightness / 125) + readability.color / 500;
                    (readable && !bestIsReadable || readable && bestIsReadable && score > bestScore || !readable && !bestIsReadable && score > bestScore) && (bestIsReadable = readable, bestScore = score, bestColor = tinycolor(colorList[i]))
                }
                return bestColor
            };
            var names = tinycolor.names = {
                    aliceblue: "f0f8ff",
                    antiquewhite: "faebd7",
                    aqua: "0ff",
                    aquamarine: "7fffd4",
                    azure: "f0ffff",
                    beige: "f5f5dc",
                    bisque: "ffe4c4",
                    black: "000",
                    blanchedalmond: "ffebcd",
                    blue: "00f",
                    blueviolet: "8a2be2",
                    brown: "a52a2a",
                    burlywood: "deb887",
                    burntsienna: "ea7e5d",
                    cadetblue: "5f9ea0",
                    chartreuse: "7fff00",
                    chocolate: "d2691e",
                    coral: "ff7f50",
                    cornflowerblue: "6495ed",
                    cornsilk: "fff8dc",
                    crimson: "dc143c",
                    cyan: "0ff",
                    darkblue: "00008b",
                    darkcyan: "008b8b",
                    darkgoldenrod: "b8860b",
                    darkgray: "a9a9a9",
                    darkgreen: "006400",
                    darkgrey: "a9a9a9",
                    darkkhaki: "bdb76b",
                    darkmagenta: "8b008b",
                    darkolivegreen: "556b2f",
                    darkorange: "ff8c00",
                    darkorchid: "9932cc",
                    darkred: "8b0000",
                    darksalmon: "e9967a",
                    darkseagreen: "8fbc8f",
                    darkslateblue: "483d8b",
                    darkslategray: "2f4f4f",
                    darkslategrey: "2f4f4f",
                    darkturquoise: "00ced1",
                    darkviolet: "9400d3",
                    deeppink: "ff1493",
                    deepskyblue: "00bfff",
                    dimgray: "696969",
                    dimgrey: "696969",
                    dodgerblue: "1e90ff",
                    firebrick: "b22222",
                    floralwhite: "fffaf0",
                    forestgreen: "228b22",
                    fuchsia: "f0f",
                    gainsboro: "dcdcdc",
                    ghostwhite: "f8f8ff",
                    gold: "ffd700",
                    goldenrod: "daa520",
                    gray: "808080",
                    green: "008000",
                    greenyellow: "adff2f",
                    grey: "808080",
                    honeydew: "f0fff0",
                    hotpink: "ff69b4",
                    indianred: "cd5c5c",
                    indigo: "4b0082",
                    ivory: "fffff0",
                    khaki: "f0e68c",
                    lavender: "e6e6fa",
                    lavenderblush: "fff0f5",
                    lawngreen: "7cfc00",
                    lemonchiffon: "fffacd",
                    lightblue: "add8e6",
                    lightcoral: "f08080",
                    lightcyan: "e0ffff",
                    lightgoldenrodyellow: "fafad2",
                    lightgray: "d3d3d3",
                    lightgreen: "90ee90",
                    lightgrey: "d3d3d3",
                    lightpink: "ffb6c1",
                    lightsalmon: "ffa07a",
                    lightseagreen: "20b2aa",
                    lightskyblue: "87cefa",
                    lightslategray: "789",
                    lightslategrey: "789",
                    lightsteelblue: "b0c4de",
                    lightyellow: "ffffe0",
                    lime: "0f0",
                    limegreen: "32cd32",
                    linen: "faf0e6",
                    magenta: "f0f",
                    maroon: "800000",
                    mediumaquamarine: "66cdaa",
                    mediumblue: "0000cd",
                    mediumorchid: "ba55d3",
                    mediumpurple: "9370db",
                    mediumseagreen: "3cb371",
                    mediumslateblue: "7b68ee",
                    mediumspringgreen: "00fa9a",
                    mediumturquoise: "48d1cc",
                    mediumvioletred: "c71585",
                    midnightblue: "191970",
                    mintcream: "f5fffa",
                    mistyrose: "ffe4e1",
                    moccasin: "ffe4b5",
                    navajowhite: "ffdead",
                    navy: "000080",
                    oldlace: "fdf5e6",
                    olive: "808000",
                    olivedrab: "6b8e23",
                    orange: "ffa500",
                    orangered: "ff4500",
                    orchid: "da70d6",
                    palegoldenrod: "eee8aa",
                    palegreen: "98fb98",
                    paleturquoise: "afeeee",
                    palevioletred: "db7093",
                    papayawhip: "ffefd5",
                    peachpuff: "ffdab9",
                    peru: "cd853f",
                    pink: "ffc0cb",
                    plum: "dda0dd",
                    powderblue: "b0e0e6",
                    purple: "800080",
                    rebeccapurple: "663399",
                    red: "f00",
                    rosybrown: "bc8f8f",
                    royalblue: "4169e1",
                    saddlebrown: "8b4513",
                    salmon: "fa8072",
                    sandybrown: "f4a460",
                    seagreen: "2e8b57",
                    seashell: "fff5ee",
                    sienna: "a0522d",
                    silver: "c0c0c0",
                    skyblue: "87ceeb",
                    slateblue: "6a5acd",
                    slategray: "708090",
                    slategrey: "708090",
                    snow: "fffafa",
                    springgreen: "00ff7f",
                    steelblue: "4682b4",
                    tan: "d2b48c",
                    teal: "008080",
                    thistle: "d8bfd8",
                    tomato: "ff6347",
                    turquoise: "40e0d0",
                    violet: "ee82ee",
                    wheat: "f5deb3",
                    white: "fff",
                    whitesmoke: "f5f5f5",
                    yellow: "ff0",
                    yellowgreen: "9acd32"
                },
                hexNames = tinycolor.hexNames = flip(names),
                matchers = function() {
                    var CSS_INTEGER = "[-\\+]?\\d+%?",
                        CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?",
                        CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")",
                        PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?",
                        PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
                    return {
                        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
                        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
                        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
                        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
                        hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
                        hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
                        hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
                        hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
                        hex8: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
                    }
                }();
            "undefined" != typeof module && module.exports ? module.exports = tinycolor : "function" == typeof define && define.amd ? define(function() {
                return tinycolor
            }) : window.tinycolor = tinycolor
        }()
    }, {}],
    187: [function(require, module) {
        var ss = require("simple-statistics");
        module.exports = function(fc, field, num) {
            var vals = [],
                breaks = [];
            return fc.features.forEach(function(feature) {
                void 0 !== feature.properties[field] && vals.push(feature.properties[field])
            }), breaks = ss.jenks(vals, num)
        }
    }, {
        "simple-statistics": 188
    }],
    188: [function(require, module) {
        ! function() {
            function linear_regression() {
                var linreg = {},
                    data = [];
                return linreg.data = function(x) {
                    return arguments.length ? (data = x.slice(), linreg) : data
                }, linreg.mb = function() {
                    var m, b, data_length = data.length;
                    if (1 === data_length) m = 0, b = data[0][1];
                    else {
                        for (var point, x, y, sum_x = 0, sum_y = 0, sum_xx = 0, sum_xy = 0, i = 0; data_length > i; i++) point = data[i], x = point[0], y = point[1], sum_x += x, sum_y += y, sum_xx += x * x, sum_xy += x * y;
                        m = (data_length * sum_xy - sum_x * sum_y) / (data_length * sum_xx - sum_x * sum_x), b = sum_y / data_length - m * sum_x / data_length
                    }
                    return {
                        m: m,
                        b: b
                    }
                }, linreg.m = function() {
                    return linreg.mb().m
                }, linreg.b = function() {
                    return linreg.mb().b
                }, linreg.line = function() {
                    var mb = linreg.mb(),
                        m = mb.m,
                        b = mb.b;
                    return function(x) {
                        return b + m * x
                    }
                }, linreg
            }

            function r_squared(data, f) {
                if (data.length < 2) return 1;
                for (var average, sum = 0, i = 0; i < data.length; i++) sum += data[i][1];
                average = sum / data.length;
                for (var sum_of_squares = 0, j = 0; j < data.length; j++) sum_of_squares += Math.pow(average - data[j][1], 2);
                for (var err = 0, k = 0; k < data.length; k++) err += Math.pow(data[k][1] - f(data[k][0]), 2);
                return 1 - err / sum_of_squares
            }

            function bayesian() {
                var bayes_model = {},
                    total_count = 0,
                    data = {};
                return bayes_model.train = function(item, category) {
                    data[category] || (data[category] = {});
                    for (var k in item) {
                        var v = item[k];
                        void 0 === data[category][k] && (data[category][k] = {}), void 0 === data[category][k][v] && (data[category][k][v] = 0), data[category][k][item[k]]++
                    }
                    total_count++
                }, bayes_model.score = function(item) {
                    var category, odds = {};
                    for (var k in item) {
                        var v = item[k];
                        for (category in data) void 0 === odds[category] && (odds[category] = {}), odds[category][k + "_" + v] = data[category][k] ? (data[category][k][v] || 0) / total_count : 0
                    }
                    var odds_sums = {};
                    for (category in odds)
                        for (var combination in odds[category]) void 0 === odds_sums[category] && (odds_sums[category] = 0), odds_sums[category] += odds[category][combination];
                    return odds_sums
                }, bayes_model
            }

            function sum(x) {
                for (var value = 0, i = 0; i < x.length; i++) value += x[i];
                return value
            }

            function mean(x) {
                return 0 === x.length ? null : sum(x) / x.length
            }

            function geometric_mean(x) {
                if (0 === x.length) return null;
                for (var value = 1, i = 0; i < x.length; i++) {
                    if (x[i] <= 0) return null;
                    value *= x[i]
                }
                return Math.pow(value, 1 / x.length)
            }

            function harmonic_mean(x) {
                if (0 === x.length) return null;
                for (var reciprocal_sum = 0, i = 0; i < x.length; i++) {
                    if (x[i] <= 0) return null;
                    reciprocal_sum += 1 / x[i]
                }
                return x.length / reciprocal_sum
            }

            function min(x) {
                for (var value, i = 0; i < x.length; i++)(x[i] < value || void 0 === value) && (value = x[i]);
                return value
            }

            function max(x) {
                for (var value, i = 0; i < x.length; i++)(x[i] > value || void 0 === value) && (value = x[i]);
                return value
            }

            function variance(x) {
                if (0 === x.length) return null;
                for (var mean_value = mean(x), deviations = [], i = 0; i < x.length; i++) deviations.push(Math.pow(x[i] - mean_value, 2));
                return mean(deviations)
            }

            function standard_deviation(x) {
                return 0 === x.length ? null : Math.sqrt(variance(x))
            }

            function sum_nth_power_deviations(x, n) {
                for (var mean_value = mean(x), sum = 0, i = 0; i < x.length; i++) sum += Math.pow(x[i] - mean_value, n);
                return sum
            }

            function sample_variance(x) {
                if (x.length <= 1) return null;
                var sum_squared_deviations_value = sum_nth_power_deviations(x, 2);
                return sum_squared_deviations_value / (x.length - 1)
            }

            function sample_standard_deviation(x) {
                return x.length <= 1 ? null : Math.sqrt(sample_variance(x))
            }

            function sample_covariance(x, y) {
                if (x.length <= 1 || x.length != y.length) return null;
                for (var xmean = mean(x), ymean = mean(y), sum = 0, i = 0; i < x.length; i++) sum += (x[i] - xmean) * (y[i] - ymean);
                return sum / (x.length - 1)
            }

            function sample_correlation(x, y) {
                var cov = sample_covariance(x, y),
                    xstd = sample_standard_deviation(x),
                    ystd = sample_standard_deviation(y);
                return null === cov || null === xstd || null === ystd ? null : cov / xstd / ystd
            }

            function median(x) {
                if (0 === x.length) return null;
                var sorted = x.slice().sort(function(a, b) {
                    return a - b
                });
                if (sorted.length % 2 === 1) return sorted[(sorted.length - 1) / 2];
                var a = sorted[sorted.length / 2 - 1],
                    b = sorted[sorted.length / 2];
                return (a + b) / 2
            }

            function mode(x) {
                if (0 === x.length) return null;
                if (1 === x.length) return x[0];
                for (var value, sorted = x.slice().sort(function(a, b) {
                        return a - b
                    }), last = sorted[0], max_seen = 0, seen_this = 1, i = 1; i < sorted.length + 1; i++) sorted[i] !== last ? (seen_this > max_seen && (max_seen = seen_this, value = last), seen_this = 1, last = sorted[i]) : seen_this++;
                return value
            }

            function t_test(sample, x) {
                var sample_mean = mean(sample),
                    sd = standard_deviation(sample),
                    rootN = Math.sqrt(sample.length);
                return (sample_mean - x) / (sd / rootN)
            }

            function t_test_two_sample(sample_x, sample_y, difference) {
                var n = sample_x.length,
                    m = sample_y.length;
                if (!n || !m) return null;
                difference || (difference = 0);
                var meanX = mean(sample_x),
                    meanY = mean(sample_y),
                    weightedVariance = ((n - 1) * sample_variance(sample_x) + (m - 1) * sample_variance(sample_y)) / (n + m - 2);
                return (meanX - meanY - difference) / Math.sqrt(weightedVariance * (1 / n + 1 / m))
            }

            function chunk(sample, chunkSize) {
                var output = [];
                if (0 >= chunkSize) return null;
                for (var start = 0; start < sample.length; start += chunkSize) output.push(sample.slice(start, start + chunkSize));
                return output
            }

            function shuffle_in_place(sample, randomSource) {
                randomSource = randomSource || Math.random;
                for (var temporary, index, length = sample.length; length > 0;) index = Math.floor(randomSource() * length--), temporary = sample[length], sample[length] = sample[index], sample[index] = temporary;
                return sample
            }

            function shuffle(sample, randomSource) {
                return sample = sample.slice(), shuffle_in_place(sample.slice(), randomSource)
            }

            function sample(array, n, randomSource) {
                var shuffled = shuffle(array, randomSource);
                return shuffled.slice(0, n)
            }

            function quantile(sample, p) {
                if (0 === sample.length) return null;
                var sorted = sample.slice().sort(function(a, b) {
                    return a - b
                });
                if (p.length) {
                    for (var results = [], i = 0; i < p.length; i++) results[i] = quantile_sorted(sorted, p[i]);
                    return results
                }
                return quantile_sorted(sorted, p)
            }

            function quantile_sorted(sample, p) {
                var idx = sample.length * p;
                return 0 > p || p > 1 ? null : 1 === p ? sample[sample.length - 1] : 0 === p ? sample[0] : idx % 1 !== 0 ? sample[Math.ceil(idx) - 1] : sample.length % 2 === 0 ? (sample[idx - 1] + sample[idx]) / 2 : sample[idx]
            }

            function iqr(sample) {
                return 0 === sample.length ? null : quantile(sample, .75) - quantile(sample, .25)
            }

            function mad(x) {
                if (!x || 0 === x.length) return null;
                for (var median_value = median(x), median_absolute_deviations = [], i = 0; i < x.length; i++) median_absolute_deviations.push(Math.abs(x[i] - median_value));
                return median(median_absolute_deviations)
            }

            function jenksMatrices(data, n_classes) {
                var i, j, lower_class_limits = [],
                    variance_combinations = [],
                    variance = 0;
                for (i = 0; i < data.length + 1; i++) {
                    var tmp1 = [],
                        tmp2 = [];
                    for (j = 0; n_classes + 1 > j; j++) tmp1.push(0), tmp2.push(0);
                    lower_class_limits.push(tmp1), variance_combinations.push(tmp2)
                }
                for (i = 1; n_classes + 1 > i; i++)
                    for (lower_class_limits[1][i] = 1, variance_combinations[1][i] = 0, j = 2; j < data.length + 1; j++) variance_combinations[j][i] = 1 / 0;
                for (var l = 2; l < data.length + 1; l++) {
                    for (var sum = 0, sum_squares = 0, w = 0, i4 = 0, m = 1; l + 1 > m; m++) {
                        var lower_class_limit = l - m + 1,
                            val = data[lower_class_limit - 1];
                        if (w++, sum += val, sum_squares += val * val, variance = sum_squares - sum * sum / w, i4 = lower_class_limit - 1, 0 !== i4)
                            for (j = 2; n_classes + 1 > j; j++) variance_combinations[l][j] >= variance + variance_combinations[i4][j - 1] && (lower_class_limits[l][j] = lower_class_limit, variance_combinations[l][j] = variance + variance_combinations[i4][j - 1])
                    }
                    lower_class_limits[l][1] = 1, variance_combinations[l][1] = variance
                }
                return {
                    lower_class_limits: lower_class_limits,
                    variance_combinations: variance_combinations
                }
            }

            function jenksBreaks(data, lower_class_limits, n_classes) {
                var k = data.length - 1,
                    kclass = [],
                    countNum = n_classes;
                for (kclass[n_classes] = data[data.length - 1], kclass[0] = data[0]; countNum > 1;) kclass[countNum - 1] = data[lower_class_limits[k][countNum] - 2], k = lower_class_limits[k][countNum] - 1, countNum--;
                return kclass
            }

            function jenks(data, n_classes) {
                if (n_classes > data.length) return null;
                data = data.slice().sort(function(a, b) {
                    return a - b
                });
                var matrices = jenksMatrices(data, n_classes),
                    lower_class_limits = matrices.lower_class_limits;
                return jenksBreaks(data, lower_class_limits, n_classes)
            }

            function sample_skewness(x) {
                if (x.length < 3) return null;
                var n = x.length,
                    cubed_s = Math.pow(sample_standard_deviation(x), 3),
                    sum_cubed_deviations = sum_nth_power_deviations(x, 3);
                return n * sum_cubed_deviations / ((n - 1) * (n - 2) * cubed_s)
            }

            function cumulative_std_normal_probability(z) {
                var absZ = Math.abs(z),
                    row = Math.floor(10 * absZ),
                    column = 10 * (Math.floor(100 * absZ) / 10 - Math.floor(100 * absZ / 10)),
                    index = Math.min(10 * row + column, standard_normal_table.length - 1);
                return z >= 0 ? standard_normal_table[index] : +(1 - standard_normal_table[index]).toFixed(4)
            }

            function z_score(x, mean, standard_deviation) {
                return (x - mean) / standard_deviation
            }

            function factorial(n) {
                if (0 > n) return null;
                for (var accumulator = 1, i = 2; n >= i; i++) accumulator *= i;
                return accumulator
            }

            function bernoulli_distribution(p) {
                return 0 > p || p > 1 ? null : binomial_distribution(1, p)
            }

            function binomial_distribution(trials, probability) {
                function probability_mass(x, trials, probability) {
                    return factorial(trials) / (factorial(x) * factorial(trials - x)) * Math.pow(probability, x) * Math.pow(1 - probability, trials - x)
                }
                if (0 > probability || probability > 1 || 0 >= trials || trials % 1 !== 0) return null;
                var x = 0,
                    cumulative_probability = 0,
                    cells = {};
                do cells[x] = probability_mass(x, trials, probability), cumulative_probability += cells[x], x++; while (1 - epsilon > cumulative_probability);
                return cells
            }

            function poisson_distribution(lambda) {
                function probability_mass(x, lambda) {
                    return Math.pow(Math.E, -lambda) * Math.pow(lambda, x) / factorial(x)
                }
                if (0 >= lambda) return null;
                var x = 0,
                    cumulative_probability = 0,
                    cells = {};
                do cells[x] = probability_mass(x, lambda), cumulative_probability += cells[x], x++; while (1 - epsilon > cumulative_probability);
                return cells
            }

            function chi_squared_goodness_of_fit(data, distribution_type, significance) {
                for (var degrees_of_freedom, k, input_mean = mean(data), chi_squared = 0, c = 1, hypothesized_distribution = distribution_type(input_mean), observed_frequencies = [], expected_frequencies = [], i = 0; i < data.length; i++) void 0 === observed_frequencies[data[i]] && (observed_frequencies[data[i]] = 0), observed_frequencies[data[i]]++;
                for (i = 0; i < observed_frequencies.length; i++) void 0 === observed_frequencies[i] && (observed_frequencies[i] = 0);
                for (k in hypothesized_distribution) k in observed_frequencies && (expected_frequencies[k] = hypothesized_distribution[k] * data.length);
                for (k = expected_frequencies.length - 1; k >= 0; k--) expected_frequencies[k] < 3 && (expected_frequencies[k - 1] += expected_frequencies[k], expected_frequencies.pop(), observed_frequencies[k - 1] += observed_frequencies[k], observed_frequencies.pop());
                for (k = 0; k < observed_frequencies.length; k++) chi_squared += Math.pow(observed_frequencies[k] - expected_frequencies[k], 2) / expected_frequencies[k];
                return degrees_of_freedom = observed_frequencies.length - c - 1, chi_squared_distribution_table[degrees_of_freedom][significance] < chi_squared
            }

            function mixin(array) {
                function wrap(method) {
                    return function() {
                        var args = Array.prototype.slice.apply(arguments);
                        return args.unshift(this), ss[method].apply(ss, args)
                    }
                }
                var support = !(!Object.defineProperty || !Object.defineProperties);
                if (!support) throw new Error("without defineProperty, simple-statistics cannot be mixed in");
                var extending, arrayMethods = ["median", "standard_deviation", "sum", "sample_skewness", "mean", "min", "max", "quantile", "geometric_mean", "harmonic_mean"];
                extending = array ? array.slice() : Array.prototype;
                for (var i = 0; i < arrayMethods.length; i++) Object.defineProperty(extending, arrayMethods[i], {
                    value: wrap(arrayMethods[i]),
                    configurable: !0,
                    enumerable: !1,
                    writable: !0
                });
                return extending
            }
            var ss = {};
            "undefined" != typeof module ? module.exports = ss : this.ss = ss;
            var standard_normal_table = [.5, .504, .508, .512, .516, .5199, .5239, .5279, .5319, .5359, .5398, .5438, .5478, .5517, .5557, .5596, .5636, .5675, .5714, .5753, .5793, .5832, .5871, .591, .5948, .5987, .6026, .6064, .6103, .6141, .6179, .6217, .6255, .6293, .6331, .6368, .6406, .6443, .648, .6517, .6554, .6591, .6628, .6664, .67, .6736, .6772, .6808, .6844, .6879, .6915, .695, .6985, .7019, .7054, .7088, .7123, .7157, .719, .7224, .7257, .7291, .7324, .7357, .7389, .7422, .7454, .7486, .7517, .7549, .758, .7611, .7642, .7673, .7704, .7734, .7764, .7794, .7823, .7852, .7881, .791, .7939, .7967, .7995, .8023, .8051, .8078, .8106, .8133, .8159, .8186, .8212, .8238, .8264, .8289, .8315, .834, .8365, .8389, .8413, .8438, .8461, .8485, .8508, .8531, .8554, .8577, .8599, .8621, .8643, .8665, .8686, .8708, .8729, .8749, .877, .879, .881, .883, .8849, .8869, .8888, .8907, .8925, .8944, .8962, .898, .8997, .9015, .9032, .9049, .9066, .9082, .9099, .9115, .9131, .9147, .9162, .9177, .9192, .9207, .9222, .9236, .9251, .9265, .9279, .9292, .9306, .9319, .9332, .9345, .9357, .937, .9382, .9394, .9406, .9418, .9429, .9441, .9452, .9463, .9474, .9484, .9495, .9505, .9515, .9525, .9535, .9545, .9554, .9564, .9573, .9582, .9591, .9599, .9608, .9616, .9625, .9633, .9641, .9649, .9656, .9664, .9671, .9678, .9686, .9693, .9699, .9706, .9713, .9719, .9726, .9732, .9738, .9744, .975, .9756, .9761, .9767, .9772, .9778, .9783, .9788, .9793, .9798, .9803, .9808, .9812, .9817, .9821, .9826, .983, .9834, .9838, .9842, .9846, .985, .9854, .9857, .9861, .9864, .9868, .9871, .9875, .9878, .9881, .9884, .9887, .989, .9893, .9896, .9898, .9901, .9904, .9906, .9909, .9911, .9913, .9916, .9918, .992, .9922, .9925, .9927, .9929, .9931, .9932, .9934, .9936, .9938, .994, .9941, .9943, .9945, .9946, .9948, .9949, .9951, .9952, .9953, .9955, .9956, .9957, .9959, .996, .9961, .9962, .9963, .9964, .9965, .9966, .9967, .9968, .9969, .997, .9971, .9972, .9973, .9974, .9974, .9975, .9976, .9977, .9977, .9978, .9979, .9979, .998, .9981, .9981, .9982, .9982, .9983, .9984, .9984, .9985, .9985, .9986, .9986, .9987, .9987, .9987, .9988, .9988, .9989, .9989, .9989, .999, .999],
                epsilon = 1e-4,
                chi_squared_distribution_table = {
                    1: {.995: 0, .99: 0, .975: 0, .95: 0, .9: .02, .5: .45, .1: 2.71, .05: 3.84, .025: 5.02, .01: 6.63, .005: 7.88
                    },
                    2: {.995: .01, .99: .02, .975: .05, .95: .1, .9: .21, .5: 1.39, .1: 4.61, .05: 5.99, .025: 7.38, .01: 9.21, .005: 10.6
                    },
                    3: {.995: .07, .99: .11, .975: .22, .95: .35, .9: .58, .5: 2.37, .1: 6.25, .05: 7.81, .025: 9.35, .01: 11.34, .005: 12.84
                    },
                    4: {.995: .21, .99: .3, .975: .48, .95: .71, .9: 1.06, .5: 3.36, .1: 7.78, .05: 9.49, .025: 11.14, .01: 13.28, .005: 14.86
                    },
                    5: {.995: .41, .99: .55, .975: .83, .95: 1.15, .9: 1.61, .5: 4.35, .1: 9.24, .05: 11.07, .025: 12.83, .01: 15.09, .005: 16.75
                    },
                    6: {.995: .68, .99: .87, .975: 1.24, .95: 1.64, .9: 2.2, .5: 5.35, .1: 10.65, .05: 12.59, .025: 14.45, .01: 16.81, .005: 18.55
                    },
                    7: {.995: .99, .99: 1.25, .975: 1.69, .95: 2.17, .9: 2.83, .5: 6.35, .1: 12.02, .05: 14.07, .025: 16.01, .01: 18.48, .005: 20.28
                    },
                    8: {.995: 1.34, .99: 1.65, .975: 2.18, .95: 2.73, .9: 3.49, .5: 7.34, .1: 13.36, .05: 15.51, .025: 17.53, .01: 20.09, .005: 21.96
                    },
                    9: {.995: 1.73, .99: 2.09, .975: 2.7, .95: 3.33, .9: 4.17, .5: 8.34, .1: 14.68, .05: 16.92, .025: 19.02, .01: 21.67, .005: 23.59
                    },
                    10: {.995: 2.16, .99: 2.56, .975: 3.25, .95: 3.94, .9: 4.87, .5: 9.34, .1: 15.99, .05: 18.31, .025: 20.48, .01: 23.21, .005: 25.19
                    },
                    11: {.995: 2.6, .99: 3.05, .975: 3.82, .95: 4.57, .9: 5.58, .5: 10.34, .1: 17.28, .05: 19.68, .025: 21.92, .01: 24.72, .005: 26.76
                    },
                    12: {.995: 3.07, .99: 3.57, .975: 4.4, .95: 5.23, .9: 6.3, .5: 11.34, .1: 18.55, .05: 21.03, .025: 23.34, .01: 26.22, .005: 28.3
                    },
                    13: {.995: 3.57, .99: 4.11, .975: 5.01, .95: 5.89, .9: 7.04, .5: 12.34, .1: 19.81, .05: 22.36, .025: 24.74, .01: 27.69, .005: 29.82
                    },
                    14: {.995: 4.07, .99: 4.66, .975: 5.63, .95: 6.57, .9: 7.79, .5: 13.34, .1: 21.06, .05: 23.68, .025: 26.12, .01: 29.14, .005: 31.32
                    },
                    15: {.995: 4.6, .99: 5.23, .975: 6.27, .95: 7.26, .9: 8.55, .5: 14.34, .1: 22.31, .05: 25, .025: 27.49, .01: 30.58, .005: 32.8
                    },
                    16: {.995: 5.14, .99: 5.81, .975: 6.91, .95: 7.96, .9: 9.31, .5: 15.34, .1: 23.54, .05: 26.3, .025: 28.85, .01: 32, .005: 34.27
                    },
                    17: {.995: 5.7, .99: 6.41, .975: 7.56, .95: 8.67, .9: 10.09, .5: 16.34, .1: 24.77, .05: 27.59, .025: 30.19, .01: 33.41, .005: 35.72
                    },
                    18: {.995: 6.26, .99: 7.01, .975: 8.23, .95: 9.39, .9: 10.87, .5: 17.34, .1: 25.99, .05: 28.87, .025: 31.53, .01: 34.81, .005: 37.16
                    },
                    19: {.995: 6.84, .99: 7.63, .975: 8.91, .95: 10.12, .9: 11.65, .5: 18.34, .1: 27.2, .05: 30.14, .025: 32.85, .01: 36.19, .005: 38.58
                    },
                    20: {.995: 7.43, .99: 8.26, .975: 9.59, .95: 10.85, .9: 12.44, .5: 19.34, .1: 28.41, .05: 31.41, .025: 34.17, .01: 37.57, .005: 40
                    },
                    21: {.995: 8.03, .99: 8.9, .975: 10.28, .95: 11.59, .9: 13.24, .5: 20.34, .1: 29.62, .05: 32.67, .025: 35.48, .01: 38.93, .005: 41.4
                    },
                    22: {.995: 8.64, .99: 9.54, .975: 10.98, .95: 12.34, .9: 14.04, .5: 21.34, .1: 30.81, .05: 33.92, .025: 36.78, .01: 40.29, .005: 42.8
                    },
                    23: {.995: 9.26, .99: 10.2, .975: 11.69, .95: 13.09, .9: 14.85, .5: 22.34, .1: 32.01, .05: 35.17, .025: 38.08, .01: 41.64, .005: 44.18
                    },
                    24: {.995: 9.89, .99: 10.86, .975: 12.4, .95: 13.85, .9: 15.66, .5: 23.34, .1: 33.2, .05: 36.42, .025: 39.36, .01: 42.98, .005: 45.56
                    },
                    25: {.995: 10.52, .99: 11.52, .975: 13.12, .95: 14.61, .9: 16.47, .5: 24.34, .1: 34.28, .05: 37.65, .025: 40.65, .01: 44.31, .005: 46.93
                    },
                    26: {.995: 11.16, .99: 12.2, .975: 13.84, .95: 15.38, .9: 17.29, .5: 25.34, .1: 35.56, .05: 38.89, .025: 41.92, .01: 45.64, .005: 48.29
                    },
                    27: {.995: 11.81, .99: 12.88, .975: 14.57, .95: 16.15, .9: 18.11, .5: 26.34, .1: 36.74, .05: 40.11, .025: 43.19, .01: 46.96, .005: 49.65
                    },
                    28: {.995: 12.46, .99: 13.57, .975: 15.31, .95: 16.93, .9: 18.94, .5: 27.34, .1: 37.92, .05: 41.34, .025: 44.46, .01: 48.28, .005: 50.99
                    },
                    29: {.995: 13.12, .99: 14.26, .975: 16.05, .95: 17.71, .9: 19.77, .5: 28.34, .1: 39.09, .05: 42.56, .025: 45.72, .01: 49.59, .005: 52.34
                    },
                    30: {.995: 13.79, .99: 14.95, .975: 16.79, .95: 18.49, .9: 20.6, .5: 29.34, .1: 40.26, .05: 43.77, .025: 46.98, .01: 50.89, .005: 53.67
                    },
                    40: {.995: 20.71, .99: 22.16, .975: 24.43, .95: 26.51, .9: 29.05, .5: 39.34, .1: 51.81, .05: 55.76, .025: 59.34, .01: 63.69, .005: 66.77
                    },
                    50: {.995: 27.99, .99: 29.71, .975: 32.36, .95: 34.76, .9: 37.69, .5: 49.33, .1: 63.17, .05: 67.5, .025: 71.42, .01: 76.15, .005: 79.49
                    },
                    60: {.995: 35.53, .99: 37.48, .975: 40.48, .95: 43.19, .9: 46.46, .5: 59.33, .1: 74.4, .05: 79.08, .025: 83.3, .01: 88.38, .005: 91.95
                    },
                    70: {.995: 43.28, .99: 45.44, .975: 48.76, .95: 51.74, .9: 55.33, .5: 69.33, .1: 85.53, .05: 90.53, .025: 95.02, .01: 100.42, .005: 104.22
                    },
                    80: {.995: 51.17, .99: 53.54, .975: 57.15, .95: 60.39, .9: 64.28, .5: 79.33, .1: 96.58, .05: 101.88, .025: 106.63, .01: 112.33, .005: 116.32
                    },
                    90: {.995: 59.2, .99: 61.75, .975: 65.65, .95: 69.13, .9: 73.29, .5: 89.33, .1: 107.57, .05: 113.14, .025: 118.14, .01: 124.12, .005: 128.3
                    },
                    100: {.995: 67.33, .99: 70.06, .975: 74.22, .95: 77.93, .9: 82.36, .5: 99.33, .1: 118.5, .05: 124.34, .025: 129.56, .01: 135.81, .005: 140.17
                    }
                };
            ss.linear_regression = linear_regression, ss.standard_deviation = standard_deviation, ss.r_squared = r_squared, ss.median = median, ss.mean = mean, ss.mode = mode, ss.min = min, ss.max = max, ss.sum = sum, ss.quantile = quantile, ss.quantile_sorted = quantile_sorted, ss.iqr = iqr, ss.mad = mad, ss.chunk = chunk, ss.shuffle = shuffle, ss.shuffle_in_place = shuffle_in_place, ss.sample = sample, ss.sample_covariance = sample_covariance, ss.sample_correlation = sample_correlation, ss.sample_variance = sample_variance, ss.sample_standard_deviation = sample_standard_deviation, ss.sample_skewness = sample_skewness, ss.geometric_mean = geometric_mean, ss.harmonic_mean = harmonic_mean, ss.variance = variance, ss.t_test = t_test, ss.t_test_two_sample = t_test_two_sample, ss.jenksMatrices = jenksMatrices, ss.jenksBreaks = jenksBreaks, ss.jenks = jenks, ss.bayesian = bayesian, ss.epsilon = epsilon, ss.factorial = factorial, ss.bernoulli_distribution = bernoulli_distribution, ss.binomial_distribution = binomial_distribution, ss.poisson_distribution = poisson_distribution, ss.chi_squared_goodness_of_fit = chi_squared_goodness_of_fit, ss.z_score = z_score, ss.cumulative_std_normal_probability = cumulative_std_normal_probability, ss.standard_normal_table = standard_normal_table, ss.average = mean, ss.interquartile_range = iqr, ss.mixin = mixin, ss.median_absolute_deviation = mad
        }(this)
    }, {}],
    189: [function(require, module, exports) {
        (function() {
            function createReduce(dir) {
                function iterator(obj, iteratee, memo, keys, index, length) {
                    for (; index >= 0 && length > index; index += dir) {
                        var currentKey = keys ? keys[index] : index;
                        memo = iteratee(memo, obj[currentKey], currentKey, obj)
                    }
                    return memo
                }
                return function(obj, iteratee, memo, context) {
                    iteratee = optimizeCb(iteratee, context, 4);
                    var keys = !isArrayLike(obj) && _.keys(obj),
                        length = (keys || obj).length,
                        index = dir > 0 ? 0 : length - 1;
                    return arguments.length < 3 && (memo = obj[keys ? keys[index] : index], index += dir), iterator(obj, iteratee, memo, keys, index, length)
                }
            }

            function createIndexFinder(dir) {
                return function(array, predicate, context) {
                    predicate = cb(predicate, context);
                    for (var length = null != array && array.length, index = dir > 0 ? 0 : length - 1; index >= 0 && length > index; index += dir)
                        if (predicate(array[index], index, array)) return index;
                    return -1
                }
            }

            function collectNonEnumProps(obj, keys) {
                var nonEnumIdx = nonEnumerableProps.length,
                    constructor = obj.constructor,
                    proto = _.isFunction(constructor) && constructor.prototype || ObjProto,
                    prop = "constructor";
                for (_.has(obj, prop) && !_.contains(keys, prop) && keys.push(prop); nonEnumIdx--;) prop = nonEnumerableProps[nonEnumIdx], prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop) && keys.push(prop)
            }
            var root = this,
                previousUnderscore = root._,
                ArrayProto = Array.prototype,
                ObjProto = Object.prototype,
                FuncProto = Function.prototype,
                push = ArrayProto.push,
                slice = ArrayProto.slice,
                toString = ObjProto.toString,
                hasOwnProperty = ObjProto.hasOwnProperty,
                nativeIsArray = Array.isArray,
                nativeKeys = Object.keys,
                nativeBind = FuncProto.bind,
                nativeCreate = Object.create,
                Ctor = function() {},
                _ = function(obj) {
                    return obj instanceof _ ? obj : this instanceof _ ? void(this._wrapped = obj) : new _(obj)
                };
            "undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = _), exports._ = _) : root._ = _, _.VERSION = "1.8.2";
            var optimizeCb = function(func, context, argCount) {
                    if (void 0 === context) return func;
                    switch (null == argCount ? 3 : argCount) {
                        case 1:
                            return function(value) {
                                return func.call(context, value)
                            };
                        case 2:
                            return function(value, other) {
                                return func.call(context, value, other)
                            };
                        case 3:
                            return function(value, index, collection) {
                                return func.call(context, value, index, collection)
                            };
                        case 4:
                            return function(accumulator, value, index, collection) {
                                return func.call(context, accumulator, value, index, collection)
                            }
                    }
                    return function() {
                        return func.apply(context, arguments)
                    }
                },
                cb = function(value, context, argCount) {
                    return null == value ? _.identity : _.isFunction(value) ? optimizeCb(value, context, argCount) : _.isObject(value) ? _.matcher(value) : _.property(value)
                };
            _.iteratee = function(value, context) {
                return cb(value, context, 1 / 0)
            };
            var createAssigner = function(keysFunc, undefinedOnly) {
                    return function(obj) {
                        var length = arguments.length;
                        if (2 > length || null == obj) return obj;
                        for (var index = 1; length > index; index++)
                            for (var source = arguments[index], keys = keysFunc(source), l = keys.length, i = 0; l > i; i++) {
                                var key = keys[i];
                                undefinedOnly && void 0 !== obj[key] || (obj[key] = source[key])
                            }
                        return obj
                    }
                },
                baseCreate = function(prototype) {
                    if (!_.isObject(prototype)) return {};
                    if (nativeCreate) return nativeCreate(prototype);
                    Ctor.prototype = prototype;
                    var result = new Ctor;
                    return Ctor.prototype = null, result
                },
                MAX_ARRAY_INDEX = Math.pow(2, 53) - 1,
                isArrayLike = function(collection) {
                    var length = collection && collection.length;
                    return "number" == typeof length && length >= 0 && MAX_ARRAY_INDEX >= length
                };
            _.each = _.forEach = function(obj, iteratee, context) {
                iteratee = optimizeCb(iteratee, context);
                var i, length;
                if (isArrayLike(obj))
                    for (i = 0, length = obj.length; length > i; i++) iteratee(obj[i], i, obj);
                else {
                    var keys = _.keys(obj);
                    for (i = 0, length = keys.length; length > i; i++) iteratee(obj[keys[i]], keys[i], obj)
                }
                return obj
            }, _.map = _.collect = function(obj, iteratee, context) {
                iteratee = cb(iteratee, context);
                for (var keys = !isArrayLike(obj) && _.keys(obj), length = (keys || obj).length, results = Array(length), index = 0; length > index; index++) {
                    var currentKey = keys ? keys[index] : index;
                    results[index] = iteratee(obj[currentKey], currentKey, obj)
                }
                return results
            }, _.reduce = _.foldl = _.inject = createReduce(1), _.reduceRight = _.foldr = createReduce(-1), _.find = _.detect = function(obj, predicate, context) {
                var key;
                return key = isArrayLike(obj) ? _.findIndex(obj, predicate, context) : _.findKey(obj, predicate, context), void 0 !== key && -1 !== key ? obj[key] : void 0
            }, _.filter = _.select = function(obj, predicate, context) {
                var results = [];
                return predicate = cb(predicate, context), _.each(obj, function(value, index, list) {
                    predicate(value, index, list) && results.push(value)
                }), results
            }, _.reject = function(obj, predicate, context) {
                return _.filter(obj, _.negate(cb(predicate)), context)
            }, _.every = _.all = function(obj, predicate, context) {
                predicate = cb(predicate, context);
                for (var keys = !isArrayLike(obj) && _.keys(obj), length = (keys || obj).length, index = 0; length > index; index++) {
                    var currentKey = keys ? keys[index] : index;
                    if (!predicate(obj[currentKey], currentKey, obj)) return !1
                }
                return !0
            }, _.some = _.any = function(obj, predicate, context) {
                predicate = cb(predicate, context);
                for (var keys = !isArrayLike(obj) && _.keys(obj), length = (keys || obj).length, index = 0; length > index; index++) {
                    var currentKey = keys ? keys[index] : index;
                    if (predicate(obj[currentKey], currentKey, obj)) return !0
                }
                return !1
            }, _.contains = _.includes = _.include = function(obj, target, fromIndex) {
                return isArrayLike(obj) || (obj = _.values(obj)), _.indexOf(obj, target, "number" == typeof fromIndex && fromIndex) >= 0
            }, _.invoke = function(obj, method) {
                var args = slice.call(arguments, 2),
                    isFunc = _.isFunction(method);
                return _.map(obj, function(value) {
                    var func = isFunc ? method : value[method];
                    return null == func ? func : func.apply(value, args)
                })
            }, _.pluck = function(obj, key) {
                return _.map(obj, _.property(key))
            }, _.where = function(obj, attrs) {
                return _.filter(obj, _.matcher(attrs))
            }, _.findWhere = function(obj, attrs) {
                return _.find(obj, _.matcher(attrs))
            }, _.max = function(obj, iteratee, context) {
                var value, computed, result = -(1 / 0),
                    lastComputed = -(1 / 0);
                if (null == iteratee && null != obj) {
                    obj = isArrayLike(obj) ? obj : _.values(obj);
                    for (var i = 0, length = obj.length; length > i; i++) value = obj[i], value > result && (result = value)
                } else iteratee = cb(iteratee, context), _.each(obj, function(value, index, list) {
                    computed = iteratee(value, index, list), (computed > lastComputed || computed === -(1 / 0) && result === -(1 / 0)) && (result = value, lastComputed = computed)
                });
                return result
            }, _.min = function(obj, iteratee, context) {
                var value, computed, result = 1 / 0,
                    lastComputed = 1 / 0;
                if (null == iteratee && null != obj) {
                    obj = isArrayLike(obj) ? obj : _.values(obj);
                    for (var i = 0, length = obj.length; length > i; i++) value = obj[i], result > value && (result = value)
                } else iteratee = cb(iteratee, context), _.each(obj, function(value, index, list) {
                    computed = iteratee(value, index, list), (lastComputed > computed || computed === 1 / 0 && result === 1 / 0) && (result = value, lastComputed = computed)
                });
                return result
            }, _.shuffle = function(obj) {
                for (var rand, set = isArrayLike(obj) ? obj : _.values(obj), length = set.length, shuffled = Array(length), index = 0; length > index; index++) rand = _.random(0, index), rand !== index && (shuffled[index] = shuffled[rand]), shuffled[rand] = set[index];
                return shuffled
            }, _.sample = function(obj, n, guard) {
                return null == n || guard ? (isArrayLike(obj) || (obj = _.values(obj)), obj[_.random(obj.length - 1)]) : _.shuffle(obj).slice(0, Math.max(0, n))
            }, _.sortBy = function(obj, iteratee, context) {
                return iteratee = cb(iteratee, context), _.pluck(_.map(obj, function(value, index, list) {
                    return {
                        value: value,
                        index: index,
                        criteria: iteratee(value, index, list)
                    }
                }).sort(function(left, right) {
                    var a = left.criteria,
                        b = right.criteria;
                    if (a !== b) {
                        if (a > b || void 0 === a) return 1;
                        if (b > a || void 0 === b) return -1
                    }
                    return left.index - right.index
                }), "value")
            };
            var group = function(behavior) {
                return function(obj, iteratee, context) {
                    var result = {};
                    return iteratee = cb(iteratee, context), _.each(obj, function(value, index) {
                        var key = iteratee(value, index, obj);
                        behavior(result, value, key)
                    }), result
                }
            };
            _.groupBy = group(function(result, value, key) {
                _.has(result, key) ? result[key].push(value) : result[key] = [value]
            }), _.indexBy = group(function(result, value, key) {
                result[key] = value
            }), _.countBy = group(function(result, value, key) {
                _.has(result, key) ? result[key]++ : result[key] = 1
            }), _.toArray = function(obj) {
                return obj ? _.isArray(obj) ? slice.call(obj) : isArrayLike(obj) ? _.map(obj, _.identity) : _.values(obj) : []
            }, _.size = function(obj) {
                return null == obj ? 0 : isArrayLike(obj) ? obj.length : _.keys(obj).length
            }, _.partition = function(obj, predicate, context) {
                predicate = cb(predicate, context);
                var pass = [],
                    fail = [];
                return _.each(obj, function(value, key, obj) {
                    (predicate(value, key, obj) ? pass : fail).push(value)
                }), [pass, fail]
            }, _.first = _.head = _.take = function(array, n, guard) {
                return null == array ? void 0 : null == n || guard ? array[0] : _.initial(array, array.length - n)
            }, _.initial = function(array, n, guard) {
                return slice.call(array, 0, Math.max(0, array.length - (null == n || guard ? 1 : n)))
            }, _.last = function(array, n, guard) {
                return null == array ? void 0 : null == n || guard ? array[array.length - 1] : _.rest(array, Math.max(0, array.length - n))
            }, _.rest = _.tail = _.drop = function(array, n, guard) {
                return slice.call(array, null == n || guard ? 1 : n)
            }, _.compact = function(array) {
                return _.filter(array, _.identity)
            };
            var flatten = function(input, shallow, strict, startIndex) {
                for (var output = [], idx = 0, i = startIndex || 0, length = input && input.length; length > i; i++) {
                    var value = input[i];
                    if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
                        shallow || (value = flatten(value, shallow, strict));
                        var j = 0,
                            len = value.length;
                        for (output.length += len; len > j;) output[idx++] = value[j++]
                    } else strict || (output[idx++] = value)
                }
                return output
            };
            _.flatten = function(array, shallow) {
                return flatten(array, shallow, !1)
            }, _.without = function(array) {
                return _.difference(array, slice.call(arguments, 1))
            }, _.uniq = _.unique = function(array, isSorted, iteratee, context) {
                if (null == array) return [];
                _.isBoolean(isSorted) || (context = iteratee, iteratee = isSorted, isSorted = !1), null != iteratee && (iteratee = cb(iteratee, context));
                for (var result = [], seen = [], i = 0, length = array.length; length > i; i++) {
                    var value = array[i],
                        computed = iteratee ? iteratee(value, i, array) : value;
                    isSorted ? (i && seen === computed || result.push(value), seen = computed) : iteratee ? _.contains(seen, computed) || (seen.push(computed), result.push(value)) : _.contains(result, value) || result.push(value)
                }
                return result
            }, _.union = function() {
                return _.uniq(flatten(arguments, !0, !0))
            }, _.intersection = function(array) {
                if (null == array) return [];
                for (var result = [], argsLength = arguments.length, i = 0, length = array.length; length > i; i++) {
                    var item = array[i];
                    if (!_.contains(result, item)) {
                        for (var j = 1; argsLength > j && _.contains(arguments[j], item); j++);
                        j === argsLength && result.push(item)
                    }
                }
                return result
            }, _.difference = function(array) {
                var rest = flatten(arguments, !0, !0, 1);
                return _.filter(array, function(value) {
                    return !_.contains(rest, value)
                })
            }, _.zip = function() {
                return _.unzip(arguments)
            }, _.unzip = function(array) {
                for (var length = array && _.max(array, "length").length || 0, result = Array(length), index = 0; length > index; index++) result[index] = _.pluck(array, index);
                return result
            }, _.object = function(list, values) {
                for (var result = {}, i = 0, length = list && list.length; length > i; i++) values ? result[list[i]] = values[i] : result[list[i][0]] = list[i][1];
                return result
            }, _.indexOf = function(array, item, isSorted) {
                var i = 0,
                    length = array && array.length;
                if ("number" == typeof isSorted) i = 0 > isSorted ? Math.max(0, length + isSorted) : isSorted;
                else if (isSorted && length) return i = _.sortedIndex(array, item), array[i] === item ? i : -1;
                if (item !== item) return _.findIndex(slice.call(array, i), _.isNaN);
                for (; length > i; i++)
                    if (array[i] === item) return i;
                return -1
            }, _.lastIndexOf = function(array, item, from) {
                var idx = array ? array.length : 0;
                if ("number" == typeof from && (idx = 0 > from ? idx + from + 1 : Math.min(idx, from + 1)), item !== item) return _.findLastIndex(slice.call(array, 0, idx), _.isNaN);
                for (; --idx >= 0;)
                    if (array[idx] === item) return idx;
                return -1
            }, _.findIndex = createIndexFinder(1), _.findLastIndex = createIndexFinder(-1), _.sortedIndex = function(array, obj, iteratee, context) {
                iteratee = cb(iteratee, context, 1);
                for (var value = iteratee(obj), low = 0, high = array.length; high > low;) {
                    var mid = Math.floor((low + high) / 2);
                    iteratee(array[mid]) < value ? low = mid + 1 : high = mid
                }
                return low
            }, _.range = function(start, stop, step) {
                arguments.length <= 1 && (stop = start || 0, start = 0), step = step || 1;
                for (var length = Math.max(Math.ceil((stop - start) / step), 0), range = Array(length), idx = 0; length > idx; idx++, start += step) range[idx] = start;
                return range
            };
            var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
                if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
                var self = baseCreate(sourceFunc.prototype),
                    result = sourceFunc.apply(self, args);
                return _.isObject(result) ? result : self
            };
            _.bind = function(func, context) {
                if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
                if (!_.isFunction(func)) throw new TypeError("Bind must be called on a function");
                var args = slice.call(arguments, 2),
                    bound = function() {
                        return executeBound(func, bound, context, this, args.concat(slice.call(arguments)))
                    };
                return bound
            }, _.partial = function(func) {
                var boundArgs = slice.call(arguments, 1),
                    bound = function() {
                        for (var position = 0, length = boundArgs.length, args = Array(length), i = 0; length > i; i++) args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
                        for (; position < arguments.length;) args.push(arguments[position++]);
                        return executeBound(func, bound, this, this, args)
                    };
                return bound
            }, _.bindAll = function(obj) {
                var i, key, length = arguments.length;
                if (1 >= length) throw new Error("bindAll must be passed function names");
                for (i = 1; length > i; i++) key = arguments[i], obj[key] = _.bind(obj[key], obj);
                return obj
            }, _.memoize = function(func, hasher) {
                var memoize = function(key) {
                    var cache = memoize.cache,
                        address = "" + (hasher ? hasher.apply(this, arguments) : key);
                    return _.has(cache, address) || (cache[address] = func.apply(this, arguments)), cache[address]
                };
                return memoize.cache = {}, memoize
            }, _.delay = function(func, wait) {
                var args = slice.call(arguments, 2);
                return setTimeout(function() {
                    return func.apply(null, args)
                }, wait)
            }, _.defer = _.partial(_.delay, _, 1), _.throttle = function(func, wait, options) {
                var context, args, result, timeout = null,
                    previous = 0;
                options || (options = {});
                var later = function() {
                    previous = options.leading === !1 ? 0 : _.now(), timeout = null, result = func.apply(context, args), timeout || (context = args = null)
                };
                return function() {
                    var now = _.now();
                    previous || options.leading !== !1 || (previous = now);
                    var remaining = wait - (now - previous);
                    return context = this, args = arguments, 0 >= remaining || remaining > wait ? (timeout && (clearTimeout(timeout), timeout = null), previous = now, result = func.apply(context, args), timeout || (context = args = null)) : timeout || options.trailing === !1 || (timeout = setTimeout(later, remaining)), result
                }
            }, _.debounce = function(func, wait, immediate) {
                var timeout, args, context, timestamp, result, later = function() {
                    var last = _.now() - timestamp;
                    wait > last && last >= 0 ? timeout = setTimeout(later, wait - last) : (timeout = null, immediate || (result = func.apply(context, args), timeout || (context = args = null)))
                };
                return function() {
                    context = this, args = arguments, timestamp = _.now();
                    var callNow = immediate && !timeout;
                    return timeout || (timeout = setTimeout(later, wait)), callNow && (result = func.apply(context, args), context = args = null), result
                }
            }, _.wrap = function(func, wrapper) {
                return _.partial(wrapper, func)
            }, _.negate = function(predicate) {
                return function() {
                    return !predicate.apply(this, arguments)
                }
            }, _.compose = function() {
                var args = arguments,
                    start = args.length - 1;
                return function() {
                    for (var i = start, result = args[start].apply(this, arguments); i--;) result = args[i].call(this, result);
                    return result
                }
            }, _.after = function(times, func) {
                return function() {
                    return --times < 1 ? func.apply(this, arguments) : void 0
                }
            }, _.before = function(times, func) {
                var memo;
                return function() {
                    return --times > 0 && (memo = func.apply(this, arguments)), 1 >= times && (func = null), memo
                }
            }, _.once = _.partial(_.before, 2);
            var hasEnumBug = !{
                    toString: null
                }.propertyIsEnumerable("toString"),
                nonEnumerableProps = ["valueOf", "isPrototypeOf", "toString", "propertyIsEnumerable", "hasOwnProperty", "toLocaleString"];
            _.keys = function(obj) {
                if (!_.isObject(obj)) return [];
                if (nativeKeys) return nativeKeys(obj);
                var keys = [];
                for (var key in obj) _.has(obj, key) && keys.push(key);
                return hasEnumBug && collectNonEnumProps(obj, keys), keys
            }, _.allKeys = function(obj) {
                if (!_.isObject(obj)) return [];
                var keys = [];
                for (var key in obj) keys.push(key);
                return hasEnumBug && collectNonEnumProps(obj, keys), keys
            }, _.values = function(obj) {
                for (var keys = _.keys(obj), length = keys.length, values = Array(length), i = 0; length > i; i++) values[i] = obj[keys[i]];
                return values
            }, _.mapObject = function(obj, iteratee, context) {
                iteratee = cb(iteratee, context);
                for (var currentKey, keys = _.keys(obj), length = keys.length, results = {}, index = 0; length > index; index++) currentKey = keys[index], results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
                return results
            }, _.pairs = function(obj) {
                for (var keys = _.keys(obj), length = keys.length, pairs = Array(length), i = 0; length > i; i++) pairs[i] = [keys[i], obj[keys[i]]];
                return pairs
            }, _.invert = function(obj) {
                for (var result = {}, keys = _.keys(obj), i = 0, length = keys.length; length > i; i++) result[obj[keys[i]]] = keys[i];
                return result
            }, _.functions = _.methods = function(obj) {
                var names = [];
                for (var key in obj) _.isFunction(obj[key]) && names.push(key);
                return names.sort()
            }, _.extend = createAssigner(_.allKeys), _.extendOwn = _.assign = createAssigner(_.keys), _.findKey = function(obj, predicate, context) {
                predicate = cb(predicate, context);
                for (var key, keys = _.keys(obj), i = 0, length = keys.length; length > i; i++)
                    if (key = keys[i], predicate(obj[key], key, obj)) return key
            }, _.pick = function(object, oiteratee, context) {
                var iteratee, keys, result = {},
                    obj = object;
                if (null == obj) return result;
                _.isFunction(oiteratee) ? (keys = _.allKeys(obj), iteratee = optimizeCb(oiteratee, context)) : (keys = flatten(arguments, !1, !1, 1), iteratee = function(value, key, obj) {
                    return key in obj
                }, obj = Object(obj));
                for (var i = 0, length = keys.length; length > i; i++) {
                    var key = keys[i],
                        value = obj[key];
                    iteratee(value, key, obj) && (result[key] = value)
                }
                return result
            }, _.omit = function(obj, iteratee, context) {
                if (_.isFunction(iteratee)) iteratee = _.negate(iteratee);
                else {
                    var keys = _.map(flatten(arguments, !1, !1, 1), String);
                    iteratee = function(value, key) {
                        return !_.contains(keys, key)
                    }
                }
                return _.pick(obj, iteratee, context)
            }, _.defaults = createAssigner(_.allKeys, !0), _.clone = function(obj) {
                return _.isObject(obj) ? _.isArray(obj) ? obj.slice() : _.extend({}, obj) : obj
            }, _.tap = function(obj, interceptor) {
                return interceptor(obj), obj
            }, _.isMatch = function(object, attrs) {
                var keys = _.keys(attrs),
                    length = keys.length;
                if (null == object) return !length;
                for (var obj = Object(object), i = 0; length > i; i++) {
                    var key = keys[i];
                    if (attrs[key] !== obj[key] || !(key in obj)) return !1
                }
                return !0
            };
            var eq = function(a, b, aStack, bStack) {
                if (a === b) return 0 !== a || 1 / a === 1 / b;
                if (null == a || null == b) return a === b;
                a instanceof _ && (a = a._wrapped), b instanceof _ && (b = b._wrapped);
                var className = toString.call(a);
                if (className !== toString.call(b)) return !1;
                switch (className) {
                    case "[object RegExp]":
                    case "[object String]":
                        return "" + a == "" + b;
                    case "[object Number]":
                        return +a !== +a ? +b !== +b : 0 === +a ? 1 / +a === 1 / b : +a === +b;
                    case "[object Date]":
                    case "[object Boolean]":
                        return +a === +b
                }
                var areArrays = "[object Array]" === className;
                if (!areArrays) {
                    if ("object" != typeof a || "object" != typeof b) return !1;
                    var aCtor = a.constructor,
                        bCtor = b.constructor;
                    if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor) && "constructor" in a && "constructor" in b) return !1
                }
                aStack = aStack || [], bStack = bStack || [];
                for (var length = aStack.length; length--;)
                    if (aStack[length] === a) return bStack[length] === b;
                if (aStack.push(a), bStack.push(b), areArrays) {
                    if (length = a.length, length !== b.length) return !1;
                    for (; length--;)
                        if (!eq(a[length], b[length], aStack, bStack)) return !1
                } else {
                    var key, keys = _.keys(a);
                    if (length = keys.length, _.keys(b).length !== length) return !1;
                    for (; length--;)
                        if (key = keys[length], !_.has(b, key) || !eq(a[key], b[key], aStack, bStack)) return !1
                }
                return aStack.pop(), bStack.pop(), !0
            };
            _.isEqual = function(a, b) {
                return eq(a, b)
            }, _.isEmpty = function(obj) {
                return null == obj ? !0 : isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) ? 0 === obj.length : 0 === _.keys(obj).length
            }, _.isElement = function(obj) {
                return !(!obj || 1 !== obj.nodeType)
            }, _.isArray = nativeIsArray || function(obj) {
                return "[object Array]" === toString.call(obj)
            }, _.isObject = function(obj) {
                var type = typeof obj;
                return "function" === type || "object" === type && !!obj
            }, _.each(["Arguments", "Function", "String", "Number", "Date", "RegExp", "Error"], function(name) {
                _["is" + name] = function(obj) {
                    return toString.call(obj) === "[object " + name + "]"
                }
            }), _.isArguments(arguments) || (_.isArguments = function(obj) {
                return _.has(obj, "callee")
            }), "function" != typeof /./ && "object" != typeof Int8Array && (_.isFunction = function(obj) {
                return "function" == typeof obj || !1
            }), _.isFinite = function(obj) {
                return isFinite(obj) && !isNaN(parseFloat(obj))
            }, _.isNaN = function(obj) {
                return _.isNumber(obj) && obj !== +obj
            }, _.isBoolean = function(obj) {
                return obj === !0 || obj === !1 || "[object Boolean]" === toString.call(obj)
            }, _.isNull = function(obj) {
                return null === obj
            }, _.isUndefined = function(obj) {
                return void 0 === obj
            }, _.has = function(obj, key) {
                return null != obj && hasOwnProperty.call(obj, key)
            }, _.noConflict = function() {
                return root._ = previousUnderscore, this
            }, _.identity = function(value) {
                return value
            }, _.constant = function(value) {
                return function() {
                    return value
                }
            }, _.noop = function() {}, _.property = function(key) {
                return function(obj) {
                    return null == obj ? void 0 : obj[key]
                }
            }, _.propertyOf = function(obj) {
                return null == obj ? function() {} : function(key) {
                    return obj[key]
                }
            }, _.matcher = _.matches = function(attrs) {
                return attrs = _.extendOwn({}, attrs),
                    function(obj) {
                        return _.isMatch(obj, attrs)
                    }
            }, _.times = function(n, iteratee, context) {
                var accum = Array(Math.max(0, n));
                iteratee = optimizeCb(iteratee, context, 1);
                for (var i = 0; n > i; i++) accum[i] = iteratee(i);
                return accum
            }, _.random = function(min, max) {
                return null == max && (max = min, min = 0), min + Math.floor(Math.random() * (max - min + 1))
            }, _.now = Date.now || function() {
                return (new Date).getTime()
            };
            var escapeMap = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#x27;",
                    "`": "&#x60;"
                },
                unescapeMap = _.invert(escapeMap),
                createEscaper = function(map) {
                    var escaper = function(match) {
                            return map[match]
                        },
                        source = "(?:" + _.keys(map).join("|") + ")",
                        testRegexp = RegExp(source),
                        replaceRegexp = RegExp(source, "g");
                    return function(string) {
                        return string = null == string ? "" : "" + string, testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string
                    }
                };
            _.escape = createEscaper(escapeMap), _.unescape = createEscaper(unescapeMap), _.result = function(object, property, fallback) {
                var value = null == object ? void 0 : object[property];
                return void 0 === value && (value = fallback), _.isFunction(value) ? value.call(object) : value
            };
            var idCounter = 0;
            _.uniqueId = function(prefix) {
                var id = ++idCounter + "";
                return prefix ? prefix + id : id
            }, _.templateSettings = {
                evaluate: /<%([\s\S]+?)%>/g,
                interpolate: /<%=([\s\S]+?)%>/g,
                escape: /<%-([\s\S]+?)%>/g
            };
            var noMatch = /(.)^/,
                escapes = {
                    "'": "'",
                    "\\": "\\",
                    "\r": "r",
                    "\n": "n",
                    "\u2028": "u2028",
                    "\u2029": "u2029"
                },
                escaper = /\\|'|\r|\n|\u2028|\u2029/g,
                escapeChar = function(match) {
                    return "\\" + escapes[match]
                };
            _.template = function(text, settings, oldSettings) {
                !settings && oldSettings && (settings = oldSettings), settings = _.defaults({}, settings, _.templateSettings);
                var matcher = RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join("|") + "|$", "g"),
                    index = 0,
                    source = "__p+='";
                text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
                    return source += text.slice(index, offset).replace(escaper, escapeChar), index = offset + match.length, escape ? source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'" : interpolate ? source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'" : evaluate && (source += "';\n" + evaluate + "\n__p+='"), match
                }), source += "';\n", settings.variable || (source = "with(obj||{}){\n" + source + "}\n"), source = "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";
                try {
                    var render = new Function(settings.variable || "obj", "_", source)
                } catch (e) {
                    throw e.source = source, e
                }
                var template = function(data) {
                        return render.call(this, data, _)
                    },
                    argument = settings.variable || "obj";
                return template.source = "function(" + argument + "){\n" + source + "}", template
            }, _.chain = function(obj) {
                var instance = _(obj);
                return instance._chain = !0, instance
            };
            var result = function(instance, obj) {
                return instance._chain ? _(obj).chain() : obj
            };
            _.mixin = function(obj) {
                _.each(_.functions(obj), function(name) {
                    var func = _[name] = obj[name];
                    _.prototype[name] = function() {
                        var args = [this._wrapped];
                        return push.apply(args, arguments), result(this, func.apply(_, args))
                    }
                })
            }, _.mixin(_), _.each(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function(name) {
                var method = ArrayProto[name];
                _.prototype[name] = function() {
                    var obj = this._wrapped;
                    return method.apply(obj, arguments), "shift" !== name && "splice" !== name || 0 !== obj.length || delete obj[0], result(this, obj)
                }
            }), _.each(["concat", "join", "slice"], function(name) {
                var method = ArrayProto[name];
                _.prototype[name] = function() {
                    return result(this, method.apply(this._wrapped, arguments))
                }
            }), _.prototype.value = function() {
                return this._wrapped
            }, _.prototype.valueOf = _.prototype.toJSON = _.prototype.value, _.prototype.toString = function() {
                return "" + this._wrapped
            }, "function" == typeof define && define.amd && define("underscore", [], function() {
                return _
            })
        }).call(this)
    }, {}],
    190: [function(require, module) {
        function createXHR(options, callback) {
            function readystatechange() {
                4 === xhr.readyState && load()
            }

            function getBody() {
                var body = null;
                if (xhr.response ? body = xhr.response : "text" !== xhr.responseType && xhr.responseType || (body = xhr.responseText || xhr.responseXML), isJson) try {
                    body = JSON.parse(body)
                } catch (e) {}
                return body
            }

            function getStatusCode() {
                return 1223 === xhr.status ? 204 : xhr.status
            }

            function errorFromStatusCode(status, body) {
                var error = null;
                if (0 === status || status >= 400 && 600 > status) {
                    var message = ("string" == typeof body ? body : !1) || messages[String(status).charAt(0)];
                    error = new Error(message), error.statusCode = status
                }
                return error
            }

            function loadResponse() {
                var status = getStatusCode(),
                    body = getBody(),
                    error = errorFromStatusCode(status, body),
                    response = {
                        body: body,
                        statusCode: status,
                        statusText: xhr.statusText,
                        raw: xhr
                    };
                response.headers = xhr.getAllResponseHeaders ? parseHeaders(xhr.getAllResponseHeaders()) : {}, callback(error, response, response.body)
            }

            function loadXhr() {
                var status = getStatusCode(),
                    error = errorFromStatusCode(status);
                xhr.status = xhr.statusCode = status, xhr.body = getBody(), xhr.headers = parseHeaders(xhr.getAllResponseHeaders()), callback(error, xhr, xhr.body)
            }

            function error(evt) {
                callback(evt, xhr)
            }
            "string" == typeof options && (options = {
                uri: options
            }), options = options || {}, callback = once(callback);
            var xhr = options.xhr || null;
            xhr || (xhr = options.cors || options.useXDR ? new XDR : new XHR);
            var key, uri = xhr.url = options.uri || options.url,
                method = xhr.method = options.method || "GET",
                body = options.body || options.data,
                headers = xhr.headers = options.headers || {},
                sync = !!options.sync,
                isJson = !1,
                load = options.response ? loadResponse : loadXhr;
            if ("json" in options && (isJson = !0, headers.Accept = "application/json", "GET" !== method && "HEAD" !== method && (headers["Content-Type"] = "application/json", body = JSON.stringify(options.json))), xhr.onreadystatechange = readystatechange, xhr.onload = load, xhr.onerror = error, xhr.onprogress = function() {}, xhr.ontimeout = noop, xhr.open(method, uri, !sync), (options.withCredentials || options.cors && options.withCredentials !== !1) && (xhr.withCredentials = !0), sync || (xhr.timeout = "timeout" in options ? options.timeout : 5e3), xhr.setRequestHeader)
                for (key in headers) headers.hasOwnProperty(key) && xhr.setRequestHeader(key, headers[key]);
            else if (options.headers) throw new Error("Headers cannot be set on an XDomainRequest object");
            return "responseType" in options && (xhr.responseType = options.responseType), "beforeSend" in options && "function" == typeof options.beforeSend && options.beforeSend(xhr), xhr.send(body), xhr
        }

        function noop() {}
        var window = require("global/window"),
            once = require("once"),
            parseHeaders = require("parse-headers"),
            messages = {
                0: "Internal XMLHttpRequest Error",
                4: "4xx Client Error",
                5: "5xx Server Error"
            },
            XHR = window.XMLHttpRequest || noop,
            XDR = "withCredentials" in new XHR ? XHR : window.XDomainRequest;
        module.exports = createXHR
    }, {
        "global/window": 191,
        once: 192,
        "parse-headers": 196
    }],
    191: [function(require, module) {
        (function(global) {
            module.exports = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {}
        }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
    }, {}],
    192: [function(require, module) {
        function once(fn) {
            var called = !1;
            return function() {
                return called ? void 0 : (called = !0, fn.apply(this, arguments))
            }
        }
        module.exports = once, once.proto = once(function() {
            Object.defineProperty(Function.prototype, "once", {
                value: function() {
                    return once(this)
                },
                configurable: !0
            })
        })
    }, {}],
    193: [function(require, module) {
        function forEach(list, iterator, context) {
            if (!isFunction(iterator)) throw new TypeError("iterator must be a function");
            arguments.length < 3 && (context = this), "[object Array]" === toString.call(list) ? forEachArray(list, iterator, context) : "string" == typeof list ? forEachString(list, iterator, context) : forEachObject(list, iterator, context)
        }

        function forEachArray(array, iterator, context) {
            for (var i = 0, len = array.length; len > i; i++) hasOwnProperty.call(array, i) && iterator.call(context, array[i], i, array)
        }

        function forEachString(string, iterator, context) {
            for (var i = 0, len = string.length; len > i; i++) iterator.call(context, string.charAt(i), i, string)
        }

        function forEachObject(object, iterator, context) {
            for (var k in object) hasOwnProperty.call(object, k) && iterator.call(context, object[k], k, object)
        }
        var isFunction = require("is-function");
        module.exports = forEach;
        var toString = Object.prototype.toString,
            hasOwnProperty = Object.prototype.hasOwnProperty
    }, {
        "is-function": 194
    }],
    194: [function(require, module) {
        function isFunction(fn) {
            var string = toString.call(fn);
            return "[object Function]" === string || "function" == typeof fn && "[object RegExp]" !== string || "undefined" != typeof window && (fn === window.setTimeout || fn === window.alert || fn === window.confirm || fn === window.prompt)
        }
        module.exports = isFunction;
        var toString = Object.prototype.toString
    }, {}],
    195: [function(require, module, exports) {
        function trim(str) {
            return str.replace(/^\s*|\s*$/g, "")
        }
        exports = module.exports = trim, exports.left = function(str) {
            return str.replace(/^\s*/, "")
        }, exports.right = function(str) {
            return str.replace(/\s*$/, "")
        }
    }, {}],
    196: [function(require, module) {
        var trim = require("trim"),
            forEach = require("for-each"),
            isArray = function(arg) {
                return "[object Array]" === Object.prototype.toString.call(arg)
            };
        module.exports = function(headers) {
            if (!headers) return {};
            var result = {};
            return forEach(trim(headers).split("\n"), function(row) {
                var index = row.indexOf(":"),
                    key = trim(row.slice(0, index)).toLowerCase(),
                    value = trim(row.slice(index + 1));
                "undefined" == typeof result[key] ? result[key] = value : isArray(result[key]) ? result[key].push(value) : result[key] = [result[key], value]
            }), result
        }
    }, {
        "for-each": 193,
        trim: 195
    }]
}, {}, [6]);
// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//

//
;