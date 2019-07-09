process.on('uncaughtException', (err) => {
  // Sometimes Node throw ECONNRESET for half-open (?) TCP-connection while 'read' syscall
  if (err.code === 'ECONNRESET' && err.syscall === 'read') {
    console.warn('ECONNRESET raised by Node');
    console.error(err);
    return;
  }

  console.error(err);
  process.exit(1);
});
