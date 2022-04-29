import { App, Modal, Setting } from "obsidian"
import { noticeHandler } from './utils'

// list all links
export class ListAllLinks extends Modal {
  constructor (
    app: App
  ) {
    super(app)
  }
}
