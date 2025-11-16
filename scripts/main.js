document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM completamente cargado");

    initSidebar();
    //initExplorer();
    initEditor();
    initTerminal();
    

});
let archivos = {};

    fetch("archivos.json")
        .then(res => {
            if (!res.ok) throw new Error("No se pudo cargar archivos.json");
            return res.json();
        })
        .then(data => {
            archivos = data;
            initExplorer(); // solo iniciar explorer después de tener archivos
        })
        .catch(err => console.error("Error al cargar archivos.json:", err));
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



function initExplorer() {
    const folders = document.querySelectorAll(".folder-header");
    const files = document.querySelectorAll(".file");

    fetch("arbol_carpetas.json")
        .then(res => {
            if (!res.ok) throw new Error("No se pudo cargar arbol_carpetas.json");
            return res.json();
        })

        .then(data => {
            const tree = document.querySelector(".file-tree");
            if (tree) renderTree(data, tree);
        })
        .catch(err => console.error("Error al cargar árbol:", err));


    folders.forEach(header => {
        header.addEventListener("click", () => {
            const folder = header.parentElement;
            folder.classList.toggle("open");
        });
    });

    files.forEach(file => {
        file.addEventListener("click", () => {
            const path = file.dataset.path;
            const name = file.textContent;

            openTab(path, name);
        });
    });
}
// 🟨 EDITOR
function initEditor() {
    const preview = document.querySelector(".code-area");
    if (preview) {
        preview.textContent = "// Bienvenido al editor\n\n// Seleccioná un archivo para comenzar...";
    }
}

// 🟥 TERMINAL
function initTerminal() {
    const terminal = document.querySelector(".terminal-output");
    if (terminal) {
        terminal.textContent = "$ terminal > listo para comandos";
    }
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
    content.textContent = typeof contenido === "string" ? contenido : `// Archivo vacío: ${path}`;
  } else if (tipo === "terminal") {
    content.innerHTML = `<pre class="terminal-output">$ ${path} > ${contenido || "sin contenido"}</pre>`;
  } else if (tipo === "browser") {
    content.innerHTML = `
      <iframe
        srcdoc="${contenido?.replace(/"/g, '&quot;') || '<p>Sin contenido</p>'}"
        sandbox="allow-scripts"
        style="width:100%; height:100%; border:none; background:#fff;"
      ></iframe>`;
  }

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
function renderTree(data, container) {
    data.forEach(item => {
        const li = document.createElement("li");

        if (item.type === "folder") {
            renderFolder(item, li);
        } else {
            renderFile(item, li);
        }

        container.appendChild(li);
    });
}

function renderFolder(item, li) {
    li.className = "folder";
    li.innerHTML = `<div class="folder-header">${item.name}</div><ul class="file-list"></ul>`;

    const fileList = li.querySelector(".file-list");
    renderTree(item.children, fileList);

    const header = li.querySelector(".folder-header");
    header.addEventListener("click", () => {
        li.classList.toggle("open");
    });
}

function renderFile(item, li) {
    li.className = "file";
    li.dataset.path = item.path;
    li.textContent = item.name;

    li.addEventListener("click", () => {
        document.querySelectorAll(".file").forEach(f => f.classList.remove("active"));
        li.classList.add("active");
        openTab(item.path, item.name);
    });
}