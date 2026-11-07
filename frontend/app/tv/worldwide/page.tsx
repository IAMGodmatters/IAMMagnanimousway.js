import type {Metadata} from 'next';
import {TvChannelPage} from '../channel-page';
export const metadata:Metadata={title:'Magnanimous TV Worldwide',description:'Filipino stories, culture and international programming for viewers around the world.'};
export default function WorldwideChannel(){return <TvChannelPage channel="worldwide"/>;}
