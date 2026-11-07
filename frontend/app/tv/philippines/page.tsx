import type {Metadata} from 'next';
import {TvChannelPage} from '../channel-page';
export const metadata:Metadata={title:'Magnanimous TV Philippines',description:'Philippine news, entertainment, education, regional voices and community programming.'};
export default function PhilippinesChannel(){return <TvChannelPage channel="philippines"/>;}
