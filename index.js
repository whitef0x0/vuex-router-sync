exports.sync = function (store, router) {
  patchStore(store)
  store.router = router

  var commit = store.commit || store.dispatch
  var isTimeTraveling = false
  var currentPath

  // sync router on store change
  store.watch(
    function (state) {
      return state.route
    },
    function (route) {
      if (route.to.path === currentPath) {
        return
      }
      isTimeTraveling = true
      currentPath = route.to.path
      router.go(route.to.path)
    },
    { deep: true, sync: true }
  )

  // sync store on router navigation
  router.afterEach(function (transition) {
    if (isTimeTraveling) {
      isTimeTraveling = false
      return
    }
    var to = transition.to
    var from = transition.from || null;
    currentPath = to.path
    commit('router/ROUTE_CHANGED', to, from)
  })
}

function applyMutationState(store, state) {
  // support above 2.0
  if (store.hasOwnProperty('_committing')) {
    return store._committing = state
  }
  return store._dispatching = state
}

function patchStore (store) {
  // add state
  var set = store._vm.constructor.set
  applyMutationState(store, true);
  set(store.state, 'route', {
    to: {
      path: '',
      query: null,
      params: null
    },
    from: {
      path: '',
      query: null,
      params: null
    }
  })
  applyMutationState(store, false);

  var routeModule = {
    mutations: {
      'router/ROUTE_CHANGED': function (state, to, from) {
        store.state.route.to = to
        store.state.route.to = from
      }
    }
  }

  // add module
  if (store.registerModule) {
    store.registerModule('route', routeModule)
  } else if (store.module) {
    store.module('route', routeModule)
  } else {
    store.hotUpdate({
      modules: {
        route: routeModule
      }
    })
  }
}
