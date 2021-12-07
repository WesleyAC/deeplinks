import connect from 'connect';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import serveStatic from 'serve-static';

export default (port) => {
  connect()
    .use(serveStatic(`${dirname(fileURLToPath(import.meta.url))}/../../`))
    .listen(port);
};
