import { atomWithToggle } from "./helpers"

export const store = {
    editor: {
        newtile: atomWithToggle(false)
    }
}

if (process.env.NODE_ENV === "development") {
    store.editor.newtile.debugLabel = "editor.newtile"
}