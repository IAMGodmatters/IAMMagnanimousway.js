import type {ReactNode} from 'react';
import './crm-theme.css';

export default function CrmLayout({children}:{children:ReactNode}){
 return <div className="crmExperience">{children}</div>;
}
