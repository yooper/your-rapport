import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";


import { db } from "../../models/db/dexieDb";
import { Artifact } from "../../models/schemas/Artifact";
import { initExtensionPage } from '../../services/init_services';
import { hideLoader, showLoader } from '../../utilities/loaders';
import { convert } from 'mhtml-to-html';
import { debug } from '../../services/logger_services';
import { blobToBase64Image } from '../../utilities/transformers';

initExtensionPage();

/**
 * TODO: support more than export exporting the artifacts into multiple views
 * @param artifact
 * @param format
 */
async function render(artifact: Artifact, format: string)
{
  // artifacts and format can be incompatible in unexpected ways
  try{
    switch(format)
    {
      case 'image':
        const image = await blobToBase64Image(artifact.data);
        return _documentWrite(`<img src='${image}`);
      case 'html':
        if(artifact.mimeType === 'multipart/related')
        {
          // TODO: Offer rendering engine option for converting
          const html = await convert(await (await artifact.data).text());
          _documentWrite(html.data);
        }
        else{
          const text = await artifact.data.text();
          _documentWrite(`${text}`);
        }
        break;
      case 'json':
      default:
        const text = await artifact.data.text();
        _documentWrite(`<pre>${text}</pre>`);
    }
  }
  catch(e){
    debug('error rending the data', {format, artifact});
  }
}


const _documentWrite = (value: string) => {
  document.body.innerHTML = value;
}

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);

  const format: string = (params.get("format") ?? "json").toLowerCase();
  const uuid:string = params.get("uuid") ?? "";

  const [isLoading, setIsLoading] = useState<boolean>(true);
  useEffect(() => {

    async function fetchData(){
      showLoader();
      setIsLoading(true);
      const artifact: Artifact|null = await db.artifact.get(uuid) ?? null;
      if(!artifact){
        document.body.innerHTML = 'Artifact Not Found'
        return;
      }

      await render(artifact, format);
      setIsLoading(false);
      hideLoader();
    }

    fetchData();

  }, [])

  if(isLoading){
    return <div>Loading...</div>
  }
};

const container = document.getElementById("app-container");
createRoot(container).render(<App />);
