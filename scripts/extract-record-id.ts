export const extractRecordId = (urlString: string) => {
  const url = new URL(urlString)

  if (url.hostname == "document-store.concord.org") {
    if (url.pathname == "/document/launch") {
      return url.searchParams.get("recordid")
    }
    const m = url.pathname.match(/\/v2\/documents\/(\d+)\/launch/)
    if (m) {
      return m[1]
    }
  } else if (url.hostname == "cloud-file-manager.concord.org") {
    return url.searchParams.get("documentId")
  }
  return undefined
}

/*
  "document-store.concord.org": {
    "paths": {
      "/document/launch": {
        "count": 14,
        "params": {
          "owner": 4,
          "doc": 4,
          "server": 14,
          "buttonText": 6,
          "recordid": 10
        }
      },
      "/v2/documents/XXXX/launch": {
        "count": 408,
        "params": {
          "server": 408,
          "buttonText": 377,
          "no_dt": 4
        }
      }
    }
  },
  "cloud-file-manager.concord.org": {
    "paths": {
      "/autolaunch/autolaunch.html": {
        "count": 1800,
        "params": {
          "server": 1800,
          "scaling": 1309,
          "documentId": 1800,
          "buttonText": 187,
          "app=is": 4,
          "di-override": 2,
          "di": 2,
          "app": 2,
          "scaling?componentMode=yes": 7,
          "interactiveApi": 1
        }
      },
      "/branch/master/autolaunch/autolaunch.html": {
        "count": 1,
        "params": {
          "documentId": 1,
          "server": 1,
          "scaling": 1
        }
      }
    }
  }
*/