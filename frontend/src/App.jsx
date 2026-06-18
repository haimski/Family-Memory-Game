import MemoryGame from './MemoryGame.jsx';
import { ImagesProvider } from './ImagesContext.jsx';

export default function App() {
  return (
    <ImagesProvider>
      <MemoryGame />
    </ImagesProvider>
  );
}
