// Runs the child's Python in Pyodide, off the main thread (so endless loops can be killed).
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

const ready = (async () => {
  const py = await loadPyodide();
  py.runPython(await (await fetch("pipbot.py")).text());
  return py.globals.get("run_json");
})();

ready.then(() => postMessage({ ready: true }), (e) => postMessage({ fatal: String(e) }));

onmessage = async (e) => {
  const runJson = await ready;
  postMessage(JSON.parse(runJson(JSON.stringify(e.data))));
};
