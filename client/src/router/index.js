// Minimal pushState-based view router. Replaces conditional rendering in App.jsx.
// No external dependencies — just React hooks + History API.
import { useEffect, useState, useCallback } from 'react';

const VIEW_MATCHERS = [
  { match: /^\/$/,                      view: 'chat'            },
  { match: /^\/onboarding$/,            view: 'onboarding'      },
  { match: /^\/history$/,               view: 'history'         },
  { match: /^\/helper$/,                view: 'helper'          },
  { match: /^\/me$/,                    view: 'me'              },
  { match: /^\/me\/(.+)$/,              view: 'me-sub'          },
  { match: /^\/chat\/([^/]+)$/,         view: 'chat'            },
  { match: /^\/chat\/([^/]+)\/guide$/,  view: 'guide'           },
  { match: /^\/admin$/,                 view: 'admin'           },
  { match: /^\/helper\/home$/,          view: 'helper-home'     },
  { match: /^\/helper\/sessions$/,      view: 'helper-sessions' },
  { match: /^\/helper\/tools$/,         view: 'helper-tools'    },
  { match: /^\/helper\/me$/,            view: 'helper-me'       },
  { match: /^\/pair$/,                  view: 'pair'            },
];

function viewFromPath(pathname) {
  for (const { match, view } of VIEW_MATCHERS) {
    const m = pathname.match(match);
    if (m) return { view, params: m.slice(1) };
  }
  return { view: 'chat', params: [] };
}

export function useRouter() {
  const [state, setState] = useState(() => viewFromPath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setState(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((path, { replace = false } = {}) => {
    if (replace) window.history.replaceState({}, '', path);
    else window.history.pushState({}, '', path);
    setState(viewFromPath(path));
  }, []);

  const back = useCallback(() => window.history.back(), []);

  return { ...state, navigate, back };
}
