import yargs from 'yargs';
import { startServer } from './server';
import { hideBin } from 'yargs/helpers';
import { startDB } from './db';

export function runCLI(argv: string[]) {
  const args = hideBin(argv);
  const cli = yargs()
    .scriptName("mrm")
    .usage('$0 <cmd> [args]')
    .command('dev', 'Start Dev server', (yargs) => {
      return yargs
        .option('port', {
          alias: 'p',
          type: 'number',
          description: 'Port to run the server on'
        })
        .option('host', {
          alias: 'h',
          type: 'string',
          description: 'Host to run the server on'
        })
    }, async function (argv) {
      console.log('Starting MRM V3 dev server...');
      await startServer({
        port: argv.port,
        host: argv.host
      });
    })
    .command('start', 'Start the MRM V3 server', (yargs) => {
      return yargs
        .option('port', {
          alias: 'p',
          type: 'number',
          description: 'Port to run the server on'
        })
        .option('host', {
          alias: 'h',
          type: 'string',
          description: 'Host to run the server on'
        })
    }, async function (argv) {
      console.log('Starting MRM V3 server...');
      await startServer({
        port: argv.port,
        host: argv.host
      });
    })
    .command('test-db', 'Test database connection', () => {}, async function () {
      console.log('Testing database connection...');
      await startDB();
      console.log('Database connection successful');
    })
    .help()
  
  // Show help if no arguments provided
  if (args.length === 0) {
    cli.showHelp();
    return;
  }
  
  return cli.parse(args);
}