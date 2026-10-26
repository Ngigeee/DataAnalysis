import app as flask_app


def test_flask_application_is_created():
    assert flask_app.app is not None


def test_flask_application_has_routes():
    routes = flask_app.app.url_map.iter_rules()
    route_paths = [route.rule for route in routes]

    assert len(route_paths) > 0
    assert "/" in route_paths
