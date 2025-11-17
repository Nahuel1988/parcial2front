document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM completamente cargado");

    initSidebar();
    initEditor();
    initTerminal();

    fetch("archivos.json")
        .then(res => {
            if (!res.ok) throw new Error("No se pudo cargar archivos.json");
            return res.json();
        })
        .then(data => {
            archivos = data;

            initExplorer((item) => {
                openTab(item.path, item.name);
            });
        })
        .catch(err => console.error("Error al cargar archivos.json:", err));
});

let archivos = {};

function detectarTipo(path) {
    const p = path.toLowerCase();
    if (p.endsWith(".html") || p.endsWith(".htm")) return "browser";
    if (p.endsWith(".sh") || p.endsWith(".md") || p.endsWith(".txt")) return "terminal";
    return "editor";
}

// 🟦 SIDEBAR
function initSidebar() {
    const buttons = document.querySelectorAll(".sidebar-icon");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const panel = btn.dataset.panel;
            console.log("Panel activo:", panel);

            // Si querés mostrar/ocultar paneles, podés hacerlo acá
        });
    });
}

// 🟩 EXPLORER

/* function onFileSelect(item) {
  console.log("Archivo seleccionado:", item.name);

  // Ejemplo de lógica según tipo de ejecución
  if (item.execution === "editor") {
    abrirEnEditor(item.path, item.name);
  } else if (item.execution === "browser") {
    abrirEnNavegador(item.path);
  } else {
    console.warn("Tipo de ejecución desconocido:", item.execution);
  }
} */


function initExplorer(onFileSelect) {
    const iconPath = "assets/icons/";

    fetch("arbol_carpetas.json")
        .then(res => {
            if (!res.ok) throw new Error("No se pudo cargar arbol_carpetas.json");
            return res.json();
        })
        .then(data => {
            const tree = document.querySelector(".file-tree");
            if (tree) {
                const flags = { firstFolderUsed: false, cartelMostrado: false };
                const flags2 = { firstFileUsed: false };
                renderTree(data, tree, iconPath, onFileSelect, flags, flags2);

                // Esperar al final del render
                setTimeout(() => {
                    const folderList = document.querySelector(".hint-folder-list");
                    if (folderList && !flags.cartelMostrado) {
                        const cartel = crearCartelGlobal("👉 Hacé clic en <strong>CV</strong>");
                        const rect = folderList.getBoundingClientRect();
                        cartel.style.top = `${rect.top + window.scrollY - 10}px`;
                        cartel.style.left = `${rect.left + window.scrollX + 20}px`;
                        flags.cartelMostrado = true;
                    }
                }, 100);
            }
        })

        .catch(err => console.error("Error al cargar árbol de carpetas:", err));
}

function renderTree(data, container, iconPath, onFileSelect, flags, flags2) {
  data.forEach(item => {
    const li = document.createElement("li");

    if (item.type === "folder") {
      if (!flags.firstFolderUsed) {
        renderFolder2(item, li, iconPath, onFileSelect, flags, flags2);
        flags.firstFolderUsed = true;
        console.log("renderFolder2 llamado");
      } else {
        renderFolder(item, li, iconPath, onFileSelect, flags, flags2);
      }
    } else {
      renderFile(item, li, iconPath, onFileSelect, flags2);
    }

    container.appendChild(li);

    // Mostrar cartel sobre el primer folder
    if (!flags.cartelMostrado && li.querySelector(".hint-folder-list")) {
      const cartel1 = ubicarCartelDerecha(".hint-folder-list", "👈 Hacé clic en <strong>CV</strong>");
      flags.cartelMostrado = true;

      const folderHeader = li.querySelector(".folder-header");
      folderHeader?.addEventListener("click", () => {
        cartel1?.remove();

        setTimeout(() => {
          const archivo = document.querySelector(".hint-file");
          if (archivo) {
            const cartel2 = ubicarCartelDerecha(".hint-file", "👈 Ahora hacé clic en <strong>index.html</strong>");

            archivo.addEventListener("click", () => {
              cartel2?.remove();

              // Esperar a que se renderice el botón
              setTimeout(() => {
                const boton = document.querySelector(".preview-button");
                if (boton) {
                  const cartel3 = ubicarCartelIzquierda(".preview-button", "👉 Hacé clic en <strong>Ver en navegador</strong>");

                  boton.addEventListener("click", () => {
                    cartel3?.remove();
                  });
                }
              }, 300);
            });
          }
        }, 300);
      });
    }
  });
}
function crearCartelGlobal(mensaje) {
  const div = document.createElement("div");
  div.className = "cartel-global";
  div.innerHTML = mensaje;
  div.style.position = "absolute";
  document.body.appendChild(div);
  console.log("Cartel creado:", div);
  return div;
}

function ubicarCartelDerecha(selector, mensaje) {
  const target = document.querySelector(selector);
  if (!target) {
    console.warn("No se encontró el selector:", selector);
    return;
  }

  const rect = target.getBoundingClientRect();
  const cartel = crearCartelGlobal(mensaje);

  cartel.style.top = `${rect.top + window.scrollY}px`;
  cartel.style.left = `${rect.right + window.scrollX + 12}px`;

  return cartel;
}
function ubicarCartelIzquierda(selector, mensaje) {
  const target = document.querySelector(selector);
  if (!target) {
    console.warn("No se encontró el selector:", selector);
    return;
  }

  const rect = target.getBoundingClientRect();
  const cartel = crearCartelGlobal(mensaje);

  cartel.style.position = "absolute";
  cartel.style.top = `${rect.top + window.scrollY}px`;
  cartel.style.left = `${rect.left + window.scrollX - cartel.offsetWidth - 12}px`; // 12px de margen a la izquierda

  return cartel;
}


function renderFolder(item, li, iconPath, onFileSelect, flags, flags2) {

    li.className = "folder";
    li.innerHTML = `
    <div class="folder-header" title="Carpeta: ${item.name}">
      <img src="${iconPath}chevron-right.svg" class="arrow" />
      <img src="${iconPath}default_folder.svg" class="folder-icon" />
      <span>${item.name}</span>
    </div>
    <ul class="file-list"></ul>
  `;

    const fileList = li.querySelector(".file-list");
    renderTree(item.children, fileList, iconPath, onFileSelect, flags, flags2);

    const header = li.querySelector(".folder-header");
    const arrow = li.querySelector(".arrow");
    const folderIcon = li.querySelector(".folder-icon");

    header.addEventListener("click", () => {
        li.classList.toggle("open");
        const isOpen = li.classList.contains("open");
        arrow.src = `${iconPath}${isOpen ? "chevron-down" : "chevron-right"}.svg`;
        folderIcon.src = `${iconPath}${isOpen ? "default_folder_opened" : "default_folder"}.svg`;
    });
}
function renderFolder2(item, li, iconPath, onFileSelect, flags, flags2) {
    console.log("🟢 renderFolder2 llamado para:", item.name)
    li.className = "folder";
    li.innerHTML = `
    <div class="folder-header" title="Carpeta: ${item.name}">
      <img src="${iconPath}chevron-right.svg" class="arrow" />
      <img src="${iconPath}default_folder.svg" class="folder-icon" />
      <span>${item.name}</span>
    </div>
    <ul class="file-list hint-folder-list"></ul>
  `;

    const fileList = li.querySelector("ul.hint-folder-list");
    if (!fileList) {
        console.warn("No se encontró el ul.hint-folder-list dentro del primer folder");
    }
    renderTree(item.children, fileList, iconPath, onFileSelect, flags, flags2);


    const header = li.querySelector(".folder-header");
    const arrow = li.querySelector(".arrow");
    const folderIcon = li.querySelector(".folder-icon");

    header.addEventListener("click", () => {
        li.classList.toggle("open");
        const isOpen = li.classList.contains("open");
        arrow.src = `${iconPath}${isOpen ? "chevron-down" : "chevron-right"}.svg`;
        folderIcon.src = `${iconPath}${isOpen ? "default_folder_opened" : "default_folder"}.svg`;
    });
}

function renderFile(item, li, iconPath, onFileSelect, flags2) {
    const fileIcon = getIconForExtension(item.name, iconPath);
    li.className = "file";

    if (!flags2.firstFileUsed) {
        li.classList.add("hint-file");
        flags2.firstFileUsed = true;
    }

    li.innerHTML = `
    <img src="${fileIcon}" class="icon" />
    <span>${item.name}</span>
  `;

    li.addEventListener("click", () => {
        document.querySelectorAll(".file").forEach(f => f.classList.remove("active"));
        li.classList.add("active");
        onFileSelect(item);
    });
}


function getIconForExtension(filename, iconPath) {
    const ext = filename.split(".").pop().toLowerCase();
    const knownIcons = ["html", "js", "css", "json", "md", "txt", "sh"];
    return `${iconPath}file_type_${knownIcons.includes(ext) ? ext : "default"}.svg`;
}


// 🟨 EDITOR
function initEditor() {
    const preview = document.querySelector(".code-area");
    if (preview) {
        preview.textContent = "// Bienvenido al editor\n\n// Seleccioná un archivo para comenzar...";
    }
}
function escribirLentoEnEditor(elemento, texto, velocidad = 20) {
    elemento.textContent = "";
    let i = 0;

    function escribir() {
        if (i < texto.length) {
            elemento.textContent += texto[i];
            i++;
            setTimeout(escribir, velocidad);
        }
    }
    escribir();
}
function openTab(path, name) {
    const tabs = document.querySelector(".tabs");
    const preview = document.querySelector(".preview");

    let existingTab = document.querySelector(`.tab[data-path="${path}"]`);
    if (existingTab) {
        activateTab(path);
        return;
    }

    const tipo = detectarTipo(path);
    const contenido = archivos[path];

    // Crear pestaña
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.path = path;
    tab.dataset.tipo = tipo;
    tab.innerHTML = `<span>${name}</span><button class="close-tab" title="Cerrar">×</button>`;
    tabs.appendChild(tab);

    // Crear contenido
    const content = document.createElement("div");
    content.className = "tab-content";
    content.dataset.path = path;

    if (tipo === "editor") {
        const texto = typeof contenido === "string" ? contenido : `// Archivo vacío: ${path}`;
        escribirLentoEnEditor(content, texto, 15);
    }
    else if (tipo === "terminal") {
        content.innerHTML = `<pre class="terminal-output">$ ${path} > ${contenido || "sin contenido"}</pre>`;
    } else if (tipo === "browser") {
        content.textContent = typeof contenido === "string" ? contenido : "";
        const btn = document.createElement("button");
        btn.className = "preview-button";
        btn.textContent = "▶ Ver en navegador";

        btn.addEventListener("click", () => {
            const htmlActual = content.textContent;
            openBrowserWindow(path, htmlActual, archivos);
        });
        content.appendChild(btn);
    }

    document.querySelector(".preview").appendChild(content);
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    preview.appendChild(content);
    content.classList.add("active");

    activateTab(path);
}

function activateTab(path) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    const tab = document.querySelector(`.tab[data-path="${path}"]`);
    const content = document.querySelector(`.tab-content[data-path="${path}"]`);

    if (tab) tab.classList.add("active");
    if (content) content.classList.add("active");
}
document.addEventListener("click", e => {
    const closeBtn = e.target.closest(".close-tab");
    if (closeBtn) {
        const tab = closeBtn.closest(".tab");
        const path = tab.dataset.path;

        // Eliminar pestaña y contenido
        tab.remove();
        document.querySelector(`.tab-content[data-path="${path}"]`)?.remove();

        // Activar la última pestaña si queda alguna
        const lastTab = document.querySelector(".tab:last-child");
        if (lastTab) {
            activateTab(lastTab.dataset.path);
        }
    }

    const clickedTab = e.target.closest(".tab");
    if (clickedTab && !e.target.classList.contains("close-tab")) {
        activateTab(clickedTab.dataset.path);
    }
});
// 🟥 TERMINAL
function initTerminal() {

    const terminal = document.querySelector(".terminal-output");
    if (terminal) {
        terminal.textContent = "$ terminal > listo para comandos";
    }
    function simularComando(comando, respuesta) {
        const output = document.getElementById("terminal-output");
        if (!output) return;

        const linea = document.createElement("div");
        linea.textContent = `$ ${comando}`;
        output.appendChild(linea);

        const respuestaLinea = document.createElement("div");
        respuestaLinea.textContent = respuesta;
        output.appendChild(respuestaLinea);

        output.scrollTop = output.scrollHeight;

    }
}

/// modulo browser
function openBrowserWindow(path, htmlContent, archivos) {
    const iframe = document.getElementById("browser-frame");
    const wrapper = document.querySelector(".browser-window");

    const base = path.replace(/\.html?$/, "");
    const css = archivos[`${base}.css`] || "";
    const js = archivos[`${base}.js`] || "";

    const fullDoc = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Vista previa - ${path}</title>
        <style>${css}</style>
      </head>
      <body>
        ${htmlContent}
        <script>
          document.addEventListener('click', e => {
            const link = e.target.closest('a[href]');
            if (link && link.getAttribute('href')) {
              e.preventDefault();
              const href = link.getAttribute('href');
              window.parent.postMessage({ tipo: 'navegar', href: href }, '*');
            }
          });
          ${js}
        </script>
      </body>
    </html>
  `;

    if (iframe) iframe.srcdoc = fullDoc;
    if (wrapper) wrapper.classList.remove("hidden");
}
document.getElementById("close-browser")?.addEventListener("click", closeBrowserWindow);
window.addEventListener("message", e => {
    const { tipo, href } = e.data;
    if (tipo === "navegar" && typeof href === "string") {
        const cleanHref = href.replace(/^\.?\/?/, ""); // quitar ./ o / inicial
        const html = archivos[cleanHref];
        if (!html) {
            console.warn("Archivo no encontrado:", cleanHref);
            return;
        }
        openBrowserWindow(cleanHref, html, archivos);
    }
});

function closeBrowserWindow() {
    const iframe = document.getElementById("browser-frame");
    const wrapper = document.querySelector(".browser-window");

    if (iframe) iframe.srcdoc = "";
    if (wrapper) wrapper.classList.add("hidden");
}
// modulo inicio de recorido
function mostrarCartelInicio(selector, mensaje) {
    const target = document.querySelector(selector);
    if (!target) return;

    let cartel = document.createElement("div");
    cartel.className = ".cartel-inicio";
    cartel.innerHTML = mensaje;
    target.appendChild(cartel);
}
function crearCartelInicio(mensaje) {
    const div = document.createElement("div");
    div.className = "cartel-inicio";
    div.innerHTML = mensaje;
    return div;
}

