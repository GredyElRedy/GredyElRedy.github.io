const media = {
  card(i, item, type, extension) {
    const cardI = document.createElement("div");
    const isImage = type === "img";
    const url = URL.createObjectURL(item);
    cardI.innerHTML = `
    <${type} src="${url}" class="card-img-top" ${
      isImage ? "" : "controls"
    } alt="such a great Gredy">
    ${isImage ? "" : "</video>"}
    <div class="card-body">
      <h5 class="card-title">Foto ${i}</h5>
      <form onsubmit='storageMedia(event,${JSON.stringify({
        i,
        url,
        type,
        extension,
      })})'>
        <input autocomplete="off" class="input-group" id="input${i}" placeholder="tag1 tag2 tag3...">
      </form>
    </div>`;
    cardI.setAttribute("class", "card");
    cardI.id = `card${i}`;
    return cardI;
  },
};

function getTags() {
  firebase
    .database()
    .ref()
    .once("value")
    .then(
      (snapshot) =>
        new Set(
          Object.values(snapshot.val())
            .map((media) => media.tags)
            .reduce((a, b) => a.concat(b))
        )
    )
    .then(console.log);
}
getTags();
// function showItems() {
//   return firebase.storage().ref().listAll();
// }

// showItems().then(({ items }) => {
//   for (const item of items) {
//     item.getDownloadURL().then((url) => {
//       const newImageFrame = document.createElement("img");
//       newImageFrame.src = url;
//       newImageFrame.onerror = urlVideo;
//       document.querySelector("#wrapper").appendChild(newImageFrame);
//     });
//   }
// });

function uploadMedia({ target }) {
  const wrapper = document.querySelector("#wrapper");
  let i = wrapper.children ? wrapper.children.length : 0;
  for (const item of target.files) {
    const type = item.type.startsWith("image/") ? "img" : "video";
    const newMediaFrame = media.card(i, item, type, item.type);
    newMediaFrame.onload = function () {
      URL.revokeObjectURL(this.src);
    };
    wrapper.appendChild(newMediaFrame);
    i++;
  }
}

async function storageMedia(event, { i, url, type, extension }) {
  event.preventDefault();
  document.querySelector("#input" + i).disabled = true;
  const blob = await fetch(url).then((r) => r.blob());
  const tags = document
    .querySelector(`#input${i}`)
    .value.trim()
    .toLowerCase()
    .split(" ");
  const mediasId = firebase.database().ref().push().key;
  const storageRef = firebase.storage().ref();
  try {
    const newFileRef = await storageRef
      .child(`${type}/${mediasId}.${extension.split("/")[1]}`)
      .put(blob);
    const newUrl = await newFileRef.ref.getDownloadURL();
    firebase.database().ref(mediasId).set({ type, url: newUrl, tags });
    document.querySelector(`#card${i}`).remove();
  } catch (e) {
    console.log(e);
  }
}

// let counter = 0;
// async function techero() {
//   const { items } = await showItems();
//   for (const item of items) {
//     const metadata = await item.getMetadata();
//     // const url = await item.getDownloadURL();
//     // const ref = firebase.database().ref((counter++).toString());
//     // const json = ref.toJSON();
//     // if (!json.url) ref.set({ url, tags: json.tags || [""] });
//     console.log(metadata);
//   }
// }
// // showItems().then(console.log);
// // techero();
// console.log(
//   firebase
//     .database()
//     .ref("500")
//     .once("value")
//     .then((snapshot) => console.log(snapshot.val()))
// );
