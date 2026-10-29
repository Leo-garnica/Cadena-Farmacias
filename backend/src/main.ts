import { createApplication } from './platform/http/create-application.js'
import { localServerOptions } from './platform/config/local-server-options.js'

const { host, port } = localServerOptions(process.env)
const app = await createApplication()
await app.listen(port, host)
console.info(`VitaFarma API demo: http://${host}:${port}/api/v1/health`)
