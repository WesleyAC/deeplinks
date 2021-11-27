import { port } from './config';
import connect from 'connect';
import serveStatic from 'serve-static';

export default function() {
  connect()
    .use(serveStatic(`${__dirname}/../`))
    .listen(port);
}
